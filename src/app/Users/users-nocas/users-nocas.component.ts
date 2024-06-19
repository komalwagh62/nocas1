
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as L from 'leaflet';
import { ApiService } from '../Shared/Api/api.service';
import { Router } from '@angular/router';
import html2canvas from 'html2canvas';
import * as domtoimage from 'dom-to-image';
import { saveAs } from 'file-saver';
import { data } from 'jquery';
import { EventListenerFocusTrapInertStrategy } from '@angular/cdk/a11y';

declare var Razorpay: any;
@Component({
  selector: 'app-users-nocas',
  templateUrl: './users-nocas.component.html',
  styleUrl: './users-nocas.component.scss'
})
export class UsersNOCASComponent implements OnInit {
  [x: string]: any;
  line: any;
  popupContent: any;
  latitudeDMS!: any;
  longitudeDMS!: any;
  lat!: number;
  long!: number;
  updatedDistance!: number;
  TopElevationForm!: FormGroup | any;
  marker!: any;
  selectedAirportName: string = '';
  selectedAirport: any;
  @ViewChild('map') mapElement!: ElementRef;
  marker2!: any;
  airports: any[] = [];
  map: any;
  city: string = "";
  geojsonLayer: any = null;
  selectedAirportIcao: string = '';
  selectedAirportIATA: string = '';
  airportCoordinates: [number, number] = [0, 0]; // Variable to store airport coordinates
  showmap: boolean = false;
  getAirportCoordinates: any;
  usingLiveLocation: boolean = false;
  locationFetched: boolean = false;
  showAlert: boolean = false;
  freeTrialCount!: number;
  isSubscribed: boolean = false;
  screenshotUrl: string | null = null;

  constructor(public apiservice: ApiService, private formbuilder: FormBuilder, private http: HttpClient, private router: Router) { }


  captureScreenshot(): void {
    const mapElement = document.getElementById('map');

    if (mapElement) {
      domtoimage.toBlob(mapElement)
        .then((blob: Blob) => {
          const formData = new FormData();
          formData.append('image', blob, 'mapScreenshot.png');

          this.http.post('http://localhost:3001/api/nocas/save-screenshot', formData).subscribe(
            response => {
              console.log('Screenshot saved successfully:', response);
            },
            error => {
              console.error('Error saving screenshot:', error);
            }
          );
        })
        .catch(error => {
          console.error('Error converting element to Blob:', error);
        });
    } else {
      console.error('Map element not found');
    }
  }

  async createNocas(subscription_id: string = "") {
    if (this.TopElevationForm.valid) {
      try {
        const screenshotPath = await this.captureScreenshot(); // Capture and save the screenshot

        const lat = parseFloat(this.TopElevationForm.value.Latitude);
        const lng = parseFloat(this.TopElevationForm.value.Longitude);
        const distance = this.calculateDistance(lat, lng, this.airportCoordinates[0], this.airportCoordinates[1]);

        // Retrieve the permissible height and elevation based on the feature's properties
        const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
          return layer.getBounds().contains([lat, lng]);
        });
        this.latitudeDMS = this.convertDDtoDMS(lat, true);
        this.longitudeDMS = this.convertDDtoDMS(lng, false);
        let permissibleHeight = 0;
        let permissibleElevation = 0;
        if (clickedFeature) {
          const properties = clickedFeature.feature.properties;
          permissibleElevation = parseFloat(properties.Name);
          permissibleHeight = permissibleElevation - parseFloat(this.TopElevationForm.value.Site_Elevation);
        }

        const requestBody = {
          user_id: this.apiservice.userData.id,
          distance: distance.toFixed(2) + "km",
          permissible_elevation: permissibleElevation + "M",
          permissible_height: permissibleHeight + "M",
          city: this.TopElevationForm.value.CITY,
          latitude: this.latitudeDMS,
          longitude: this.longitudeDMS,
          airport_name: this.selectedAirportName,
          site_elevation: this.TopElevationForm.value.Site_Elevation,
          snapshot: screenshotPath, // Use the saved screenshot path
          subscription_id: subscription_id,
        };

        console.log(requestBody);

        const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
        this.http.post("http://localhost:3001/api/nocas/createNocas", requestBody, { headers: headers })
          .subscribe(
            (resultData: any) => {
              console.log(resultData);
              if (resultData.isSubscribed || resultData.freeTrialCount > 0 || resultData.isOneTimeSubscription) {
                this.showData();
              } else {
                this.hideData();
                alert("Your Free trial expired. Please Subscribe Package");
                this.router.navigate(['PricingPlans']);
              }
            },
            (error: any) => {
              console.error("Error creating Nocas entry:", error);
              alert("Failed to create Nocas entry. Please try again.");
            }
          );
      } catch (error) {
        console.error("Error capturing and saving screenshot:", error);
        alert("Failed to capture and save screenshot. Please try again.");
      }
    } else {
      alert("Please fill out all required fields in the form.");
    }
  }



  ngOnInit(): void {
    this.TopElevationForm = this.formbuilder.group({
      Latitude: ['', [Validators.required]],
      Longitude: ['', [Validators.required]],
      CITY: ['', [Validators.required, Validators.nullValidator,]],
      location: ['manual'],
      Site_Elevation: new FormControl('', [Validators.required, Validators.nullValidator, Validators.pattern(/^[0-5]+(?:\.[0-5]+)?$/)]),
      elevationOption: ['known', Validators.required],
      snapshot: ['']
    });
    this.TopElevationForm.get('Latitude').valueChanges.subscribe((lat: number) => {
      this.latitudeDMS = this.convertDDtoDMS(this.lat, true);
       
      this.updateMarkerPosition();
      this.displayMapData(this.latitudeDMS, this.TopElevationForm.get('Longitude').value, this.marker.getLatLng());
    });
    this.TopElevationForm.get('Longitude').valueChanges.subscribe((lng: number) => {
      this.longitudeDMS = this.convertDDtoDMS(lng, false);

      this.updateMarkerPosition();
      this.displayMapData(this.TopElevationForm.get('Latitude').value, this.longitudeDMS, this.marker.getLatLng());
    });
    this.TopElevationForm.get('CITY').valueChanges.subscribe((city: string) => {
      console.log('ICAO changed:', city);
      this.city = city; // Set the value of icao when ICAO changes
      const selectedAirport = this.airports.find(airport => airport.airport_city === city);
      this.selectedAirport = selectedAirport;
      console.log(this.selectedAirport)
      this.selectedAirportName = selectedAirport ? selectedAirport.airport_name : '';
      this.selectedAirportIcao = selectedAirport ? selectedAirport.airport_icao : '';
      this.selectedAirportIATA = selectedAirport ? selectedAirport.airport_iata : '';
      if (city === 'Coimbatore' || city === 'Mumbai' || city === 'Puri') {
        console.log("Selected airport:", city);

        this.loadGeoJSON(this.map);

      } else {
        console.log("Invalid airport selected");
        if (this.geojsonLayer) {
          this.map.removeLayer(this.geojsonLayer);
        }
      }
    });
    this.fetchAirports();
    this.showDefaultMap();


  }

  convertDDtoDMS(dd: number, isLatitude: boolean): string {
    console.log(`Converting DD to DMS: ${dd}, isLatitude: ${isLatitude}`);
    const dir = dd < 0 ? (isLatitude ? 'S' : 'W') : (isLatitude ? 'N' : 'E');
    const absDd = Math.abs(dd);
    const degrees = Math.floor(absDd);
    const minutesNotTruncated = (absDd - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.round((minutesNotTruncated - minutes) * 60);
    const dms = `${degrees}°${minutes}'${seconds}"${dir}`;
    console.log(`Converted to DMS: ${dms}`);
    return dms;
  }

  hideData() {
    this.showModal();
    const airportCITY = this.TopElevationForm.get('CITY')?.value;
    const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
    const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
    if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
      // Update the markers and line
      this.updateMarkerPosition();
      this.displayModelData(latitude, longitude, this.airportCoordinates);
      this.showMap(latitude, longitude);
    }

  }
  showData() {
    // this.showModal(); // Display the modal after successful creation
    const airportCITY = this.TopElevationForm.get('CITY')?.value;
    const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
    const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
    if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
      // Update the markers and line
      this.updateMarkerPosition();
      this.displayMapData(latitude, longitude, this.airportCoordinates);
      this.showMap(latitude, longitude);
    }
  }

  displayModelData(lat: number, lng: number, airportCoordinates: [number, number]) {
    const newDistance = this.calculateDistance(lat, lng, airportCoordinates[0], airportCoordinates[1]);
    const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
      return layer.getBounds().contains([lat, lng]);
    });
    const airport_name = this.selectedAirportName.split('/')[0];
    const mapData = document.getElementById('mapData');
    if (mapData !== null) {
      mapData.innerHTML = '';
      mapData.style.display = 'none';
      const siteElevationInput = this.TopElevationForm.get('Site_Elevation');
      const siteElevation = siteElevationInput ? siteElevationInput.value : 0;
      if (clickedFeature) {
        const properties = clickedFeature.feature.properties;
        const elevation = properties.Name;
        const permissibleHeight = parseFloat(properties.Name) - siteElevation;
        mapData.innerHTML = `
                <table class="table table-hover">
                    <tbody>
                        <tr>
                            <th scope="row">Permissible Elevation<br>(AMSL Above Mean Sea Level)</th>
                            <td>*****</td>
                        </tr>
                        <tr>
                            <th scope="row">Permissible Height<br>(AGL- Above ground level)</th>
                            <td>******</td>
                        </tr>
                        <tr>
                            <th scope="row">Site Location</th>
                            <td colspan="2">Latitude: **** <br> Longitude: ****</td>
                        </tr>
                        <tr>
                            <th scope="row">Distance<br>(Site Location from ARP)</th>
                            <td colspan="2">*****</td>
                        </tr>
                    </tbody>
                </table>
                <h3>To get the Complete Result Upgrade your Account with our Subscription Plans. If you not prefrred to subscribe You can make one time payment to get the result.</h3>
                <button type="button" class="btn btn-outline-primary rounded-5 " id="subscribeButton">Subscribe</button>
                <button type="button" class="btn btn-outline-primary rounded-5 " id="paymentButton">To Make Payment</button>
            `;
      } else {
        mapData.innerHTML = `
                <div>
                    <b>Site location selected by User is outside ${airport_name} CCZM boundary published by AAI. Permissible Elevation calculation could not be processed. Please contact us for further details</b><br><br>
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th scope="row">Site Location</th>
                                <td colspan="2">Latitude: ${this.latitudeDMS} N <br> Longitude: ${this.longitudeDMS} E</td>
                            </tr>
                            <tr>
                                <th scope="row">Distance<br>(Site Location from ARP)</th>
                                <td colspan="2">*****</td>
                            </tr>
                        </tbody>
                    </table>
                </div> <br>
                <h3>To get the Complete Result Upgrade your Account with our Subscription Plans. If you not prefrred to subscribe You can make one time payment to get the result. </h3>
                <button type="button" class="btn btn-outline-primary rounded-5 " id="subscribeButton">Subscribe</button>
                <button type="button" class="btn btn-outline-primary rounded-5 " id="paymentButton">To Make Payment</button>
            `;
      }
      mapData.style.display = 'block';
      const subscribeButton = document.getElementById('subscribeButton');
      if (subscribeButton) {
        subscribeButton.addEventListener('click', this.subscribe.bind(this));
      }
      const paymentButton = document.getElementById('paymentButton');
      if (paymentButton) {
        paymentButton.addEventListener('click', this.MakePayment.bind(this));
      }
    }
  }
  subscribe() {
    this.router.navigate(['PricingPlans']);
  }
  MakePayment() {
    this.handlePayment()
  }
  handlePayment() {
    const RozarpayOptions = {
      key: 'rzp_test_IScA4BP8ntHVNp',
      amount: 50 * 100,
      currency: 'INR',
      name: 'Cognitive Navigation Pvt. Ltd',
      description: ` Plan Subscription`,
      image: 'https://imgur.com/a/J4UAMhv',
      handler: (response: any) => {
        this.router.navigate(['TransactionDetails']);
        const paymentDetails = {
          user_id: this.apiservice.userData.id,
          subscription_type: 'OneTime', // Replace with actual subscription type
          price: 50, // Replace with actual amount
          razorpay_payment_id: response.razorpay_payment_id,
          expiry_date: new Date().toISOString(),  // Assuming response contains payment ID
        };
        const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
        this.http.post('http://localhost:3001/api/subscription/addSubscription', paymentDetails, { headers: headers })
          .subscribe(
            (result: any) => {
              this.createNocas(result.subscription_id)
            },
            (error: any) => {
              console.error('Error storing payment details:', error);
            }
          );
        const confirmation = confirm("Payment Successfully Done. If you want to see payment details, please go to Transaction Details page");
        if (!confirmation) {
        }
        this.router.navigate(['C_NOCAS-MAP']);
        this.showModal(); // Display the modal after successful creation
        const airportCITY = this.TopElevationForm.get('CITY')?.value;
        const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
        const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
        if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
          this.updateMarkerPosition();
          this.displayMapData(latitude, longitude, this.airportCoordinates);
        }
      },
      prefill: {
        name: this.apiservice.userData.uname,
        email: this.apiservice.userData.email,
        contact: this.apiservice.userData.phone_number
      },
      theme: {
        color: '#528FF0'
      },
      payment_method: {
        external: ['upi']
      }
    };
    const rzp = new Razorpay(RozarpayOptions);
    rzp.open();
    rzp.on('payment.success', (response: any) => {
    });
    rzp.on('payment.error', (error: any) => {
      console.error('Payment error:', error);
      alert("Payment Failed");
    });
  }


  onElevationOptionChange() {
    const elevationOptionControl = this.TopElevationForm.get('elevationOption');
    let defaultElevation = null;
    if (elevationOptionControl && elevationOptionControl.value === 'unknown') {
      // Show the alert message if the option "I need the default site elevation" is selected
      this.showAlert = true;
      // Set default value for Site_Elevation based on selected city

      if (this.city === 'Coimbatore') {
        defaultElevation = 10;
      } else if (this.city === 'Mumbai') {
        defaultElevation = 22;
      } else if (this.city === 'Puri') {
        defaultElevation = 22;
      }
      this.TopElevationForm.patchValue({ Site_Elevation: defaultElevation });
      alert("Users shall enter site elevation value received from WGS-84 survey report. Permissible height will be calculated based on site elevation entered by user. In absense of site elevation value from user, ARP (Airport) elevation value will be used as default.")
    }
    else {
      this.showAlert = false;
    }
  }

  // airportCoordinatesList updated with city and airport names
  airportCoordinatesList: Array<[number, number, string, string]> = [
    [11.03, 77.04, 'Coimbatore', 'Coimbatore International Airport/Coimbatore/CJB'],
    [19.08, 72.86, 'Mumbai', 'Chhatrapati Shivaji Maharaj International Airport/Mumbai/BOM'],
    [19.79, 85.75, 'Puri', 'PURI AIRPORT/Puri/BBI']
  ];

  submitForm() {
    if (!this.apiservice.token) {
      alert('Please Login First');
      this.router.navigate(['UsersLogin']);
      return; // Exit the function if the token does not exist
    }

    if (!this.TopElevationForm.valid) {
      return; // Exit if the form is not valid
    }

    const confirmation = confirm("Kindly confirm that the entered site information is correct or verify");

    if (confirmation) {
      // Capture screenshot before showing any modals
      this.captureScreenshot();
      this.createNocas();
      this.showData();
      
    }
   
  }
  public isCheckboxSelected: boolean = false; // Add this flag
  handleAirportModalOK() {
    // Show the modal
    this.showModal();
    const latitudeDD = this.convertDMSToDD(this.lat, true);
    const longitudeDD = this.convertDMSToDD(this.long, false);
    this.distance = this.calculateDistance(latitudeDD, longitudeDD, this.airportCoordinates[0], this.airportCoordinates[1]);

    const airport_name = this.selectedAirportName ? this.selectedAirportName.split('/')[0] : '';
    
    // Prepare the content based on whether checkboxes are selected or not
    let mapDataContent = '';
    if (!this.isCheckboxSelected) {
      mapDataContent += `
        <div>
          <b>Site location selected by User is outside ${airport_name} CCZM boundary published by AAI. Permissible Elevation calculation could not be processed. Please contact us for further details</b><br><br>
          <table class="table table-hover">
            <tbody>
              <tr>
                <th scope="row">Site Location</th>
                <td colspan="2">Latitude: ${this.latitudeDMS}<br> Longitude: ${this.longitudeDMS}</td>
              </tr>
              <tr>
                <th scope="row">Distance (Site Location from ARP)</th>
                <td colspan="2">${this.distance ? this.distance.toFixed(2) : ''} km</td>
              </tr>
            </tbody>
          </table>
        </div><br>`;
    }
  
    // Update the mapData element with the generated content
    const mapData = document.getElementById('mapData');
    if (mapData) {
      mapData.innerHTML = mapDataContent;
    }
    
    // Close the airport modal
    const modal = document.getElementById('airportModal');
    if (modal) {
      modal.style.display = 'none';
    }
    
  }
  

  public permissibleElevation!: number;
  public permissibleheight!: number;

  airportName!: string;
  distance!: number;

  displayMapData(lat: number, lng: number, airportCoordinates: [number, number]) {
    const latitudeDD = this.convertDMSToDD(lat, true);
    const longitudeDD = this.convertDMSToDD(lng, false);
    const newDistance = this.calculateDistance(latitudeDD, longitudeDD, airportCoordinates[0], airportCoordinates[1]);

    const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
      return layer.getBounds().contains([lat, lng]);
    });

    // const airport_name = this.selectedAirportName.split('/')[0];
    const mapData = document.getElementById('mapData');

    if (mapData !== null) {
      mapData.innerHTML = '';
      mapData.style.display = 'none';

      if (clickedFeature) {

        const properties = clickedFeature.feature.properties;
        const elevation = properties.Name;
        const permissibleheight = parseFloat(properties.Name) - parseFloat(this.TopElevationForm.get('Site_Elevation').value);

        if (elevation === 'NOC Required') {
          alert("NOC Required");
          return;
        }
        mapData.innerHTML = `
          <table class="table table-hover">
            <tbody>
              <tr>
                <th scope="row">Permissible Elevation (AMSL Above Mean Sea Level)</th>
                <td>${elevation}M</td>
              </tr>
              <tr>
                <th scope="row">Permissible Height (AGL- Above ground level)</th>
                <td>${permissibleheight < 0 ? '-' : ''}${Math.abs(permissibleheight).toFixed(2)}M</td>
              </tr>
              <tr>
                <th scope="row">Site Location</th>
                <td colspan="2">Latitude: ${this.latitudeDMS}<br> Longitude: ${this.longitudeDMS}</td>
              </tr>
              <tr>
                <th scope="row">Distance (Site Location from ARP)</th>
                <td colspan="2">${newDistance.toFixed(2)} km</td>
              </tr>
            </tbody>
          </table>`;
        this.showModal();

      } else {
        this.showClosestAirportList(mapData);
      }
      mapData.style.display = 'block';
    }
  }

  showClosestAirportList(mapData: HTMLElement) {
    const latitudeDD = this.convertDMSToDD(this.lat, true);
    const longitudeDD = this.convertDMSToDD(this.long, false);

    const distances = this.airportCoordinatesList.map((airport) => {
      const [airportLat, airportLng, airportCity, airportName] = airport;
      const distance = this.calculateDistance(latitudeDD, longitudeDD, airportLat, airportLng);
      return { airportCity, airportName, distance };
    });

    distances.sort((a, b) => a.distance - b.distance);
    const top2ClosestAirports = distances.slice(0, 2);

    let modalContent = 'Closest airports:<br>';
    top2ClosestAirports.forEach((airport, index) => {
      modalContent += `${index + 1}. <input type="checkbox" class="closest-airport-checkbox" data-airport-city="${airport.airportCity}" data-airport-name="${airport.airportName}" data-distance="${airport.distance}"> ${airport.airportName}<br>`;
    });

    const airportList = document.getElementById('airportList');

    if (airportList) {
      airportList.innerHTML = modalContent;
      const modal = document.getElementById('airportModal');
      if (modal) {
        modal.style.display = 'block';
      }
    }

    const checkboxes = document.querySelectorAll('.closest-airport-checkbox');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        if ((event.target as HTMLInputElement).checked) {
          const airportCity = (event.target as HTMLElement).getAttribute('data-airport-city');
          const airportName = (event.target as HTMLElement).getAttribute('data-airport-name');
          const distance = parseFloat((event.target as HTMLElement).getAttribute('data-distance')!);
          if (airportCity && airportName && !isNaN(distance)) {
            this.updateSelectedAirport(airportCity, airportName, distance);
          }
        }
      });
    });
  }

  // Update selected airport function
  updateSelectedAirport(airportCity: string, airportName: string, distance: number) {
    this.airportName = airportName;
    this.distance = distance;
    const airport = this.airportCoordinatesList.find(airport => airport[3] === airportName);
    if (airport) {
      this.TopElevationForm.patchValue({
        CITY: airportCity,
      });
      this.selectedAirportName = airportName;
      this['selectedAirportCoordinates'] = [airport[0], airport[1]]; // Update the coordinates
    }
  }

  // Function to convert DMS to DD format
  convertDMSToDD(dms: number, isLatitude: boolean): number {
    const degrees = Math.floor(dms);
    const minutes = Math.floor((dms - degrees) * 100);
    const seconds = Math.round(((dms - degrees) * 100 - minutes) * 100);
    const direction = isLatitude ? (dms >= 0 ? 'N' : 'S') : (dms >= 0 ? 'E' : 'W');
    const dd = degrees + minutes / 60 + seconds / (60 * 60);
    return direction === 'S' || direction === 'W' ? dd * -1 : dd;
  }


  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lat = position.coords.latitude;
          this.long = position.coords.longitude;

          const popupContent = `Site Location : <br>  Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
          this.marker.addTo(this.map).bindPopup(popupContent).openPopup();
          this.updateMarkerPosition();

          // Add the code here that relies on the location data, if any
          // For example, you can call a method or perform additional operations
          // this.methodThatUsesLocationData(this.lat, this.long);
        },
        (error) => {
          // Error occurred while retrieving location
          console.error('Error getting user location:', error);
          // Notify user about the error or handle it gracefully
          alert('Error getting user location. Please make sure location services are enabled and try again.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      // Geolocation is not supported by the browser
      console.log('Geolocation is not supported by this browser.');
      // Notify user or handle it gracefully
      alert('Geolocation is not supported by this browser.');
    }
  }

  updateMarkerPosition() {
    if (this.marker) {
      this.latitudeDMS = this.convertDDtoDMS(this.lat, true);
      this.longitudeDMS = this.convertDDtoDMS(this.long, false);
      this.marker.setLatLng([this.lat, this.long]);

    }
  }

  showDefaultMap() {
    const defaultLat = 0.0;
    const defaultLong = 0.0;
    this.lat = defaultLat;
    this.long = defaultLong;
    this.showMap(this.lat, this.long);
  }

  calculateDistance(latitude1: number, longitude1: number, latitude2: number, longitude2: number): number {
    const earthRadius = 6371;
    const latitudeDiff = this.degToRad(Math.abs(latitude2 - latitude1));
    const longitudeDiff = this.degToRad(Math.abs(longitude2 - longitude1));
    const a = Math.sin(latitudeDiff / 2) * Math.sin(latitudeDiff / 2) +
      Math.cos(this.degToRad(latitude1)) * Math.cos(this.degToRad(latitude2)) *
      Math.sin(longitudeDiff / 2) * Math.sin(longitudeDiff / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;
    return distance;
  }

  degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  showMap(lat: number, lng: number) {
    this.map = L.map('map', { zoomControl: false, attributionControl: false }).setView([20.5937, 78.9629], 5);
    const streets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });
    const DarkMatter = L.tileLayer('  https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {});
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {});
    const Navigation = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16
    });
    const googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    const googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    const googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    const baseMaps = {
      'Streets': streets,
      'Satellite': satellite,
      'Navigation': Navigation,
      'Hybrid': googleHybrid,
      'Satellite google': googleSat,
      'Terrain': googleTerrain,
      'Dark': DarkMatter
    };
    const overlayMaps = {
    };
    L.control.layers(baseMaps, overlayMaps).addTo(this.map);
    streets.addTo(this.map);
    L.control.scale().addTo(this.map);
    L.control.zoom().addTo(this.map);
    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.lat = lat;
      this.long = lng;
      this.latitudeDMS = this.convertDDtoDMS(lat, true);
      this.longitudeDMS = this.convertDDtoDMS(lng, false);
      this.TopElevationForm.patchValue({
        Latitude: this.lat,
        Longitude: this.long
      });
      const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
      this.marker.setLatLng([lat, lng]).bindPopup(popupContent).openPopup();
    });

    this.marker.on('dragend', (e: any) => {
      const latlng = e.target.getLatLng();
      this.lat = latlng.lat;
      this.long = latlng.lng;
      this.latitudeDMS = this.convertDDtoDMS(this.lat, true);
      this.longitudeDMS = this.convertDDtoDMS(this.long, false);
      this.TopElevationForm.patchValue({
        Latitude: this.lat,
        Longitude: this.long
      });
      const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
      this.marker.bindPopup(popupContent).openPopup();
    });

  }

  showModal(): void {
    // Code to show the modal
    const modal = document.getElementById('exampleModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }
  closeModal(): void {
    const modal = document.getElementById('exampleModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  loadGeoJSON(map: any, zoomLevel: number = 10) {
    if (!map) {
      console.error("Map object is required to load GeoJSON.");
      return;
    }

    if (this.geojsonLayer) {
      map.removeLayer(this.geojsonLayer);
      this.geojsonLayer = null; // Reset the GeoJSON layer
    }

    if (this.marker2) {
      map.removeLayer(this.marker2);
      this.marker2 = null;
    }

    if (this.marker) {
      map.removeLayer(this.marker);
      this.marker = null; // Reset the current location marker
    }

    const selectedAirportCITY = this.TopElevationForm.get('CITY')?.value;

    if (selectedAirportCITY) {
      let airportGeoJSONPath: string;

      // Determine the GeoJSON file path based on the selected airport ICAO
      if (selectedAirportCITY === 'Coimbatore') {
        airportGeoJSONPath = 'assets/Coimbatore.geojson';
        this.airportCoordinates = [11.03, 77.04]; // Coordinates of VOCB
      } else if (selectedAirportCITY === 'Mumbai') {
        airportGeoJSONPath = 'assets/Mumbai.geojson';
        this.airportCoordinates = [19.08, 72.86]; // Coordinates of VABB
      } else if (selectedAirportCITY === 'Puri') {
        airportGeoJSONPath = 'assets/Puri.geojson';
        this.airportCoordinates = [19.79, 85.75]; // Coordinates of VEJH
      } else {
        console.error("Invalid airport ICAO code.");
        return;
      }

      // Fetch the corresponding GeoJSON file
      fetch(airportGeoJSONPath)
        .then(response => response.json())
        .then(geojsonData => {
          const features = geojsonData.features;

          // Style function to set colors based on properties from JSON
          const style = (feature: any) => {
            const color = feature.properties.Color; // Extract color from JSON
            return { fillColor: color, color: 'blue', weight: 1 }; // Define style properties
          };

          // Create GeoJSON layer with custom style function
          const geojsonLayer = L.geoJSON(features, { style: style });
          geojsonLayer.addTo(map);
          this.geojsonLayer = geojsonLayer;

          // Fit the map bounds to the GeoJSON layer
          map.fitBounds(geojsonLayer.getBounds());

          // Set the view to the center of the GeoJSON layer with the specified zoom level
          const center = geojsonLayer.getBounds().getCenter();
          map.setView(center, zoomLevel);

          // Define the custom icon for marker2 with an offset
          let customIcon = L.icon({
            iconUrl: 'assets/marker-airport.png',
            shadowUrl: 'https://opentopomap.org/leaflet/images/marker-shadow.png',

            iconSize: [40, 41],

            shadowSize: [40, 41],

            iconAnchor: [12, 40], // point of the icon which will correspond to marker's location
          });

          // Draw a marker for the selected airport with the custom icon
          this.marker2 = L.marker(this.airportCoordinates, { icon: customIcon }).addTo(map);

          const popupContent = `ARP:
          <p>${selectedAirportCITY} Airport</p><br>
          Latitude: ${this.airportCoordinates[0].toFixed(2)}
          Longitude: ${this.airportCoordinates[1].toFixed(2)}`;

          // Bind the popup content to the marker2
          this.marker2.bindPopup(popupContent);

          this.marker = L.marker([this.lat, this.long]).addTo(map);

          // Fit the map bounds to the GeoJSON layer and the markers
          const bounds = L.latLngBounds([this.airportCoordinates, [this.lat, this.long]]);
          map.fitBounds(bounds, { maxZoom: zoomLevel });

          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;

            // Update latitude and longitude form fields
            this.TopElevationForm.patchValue({
              Latitude: lat.toFixed(2),
              Longitude: lng.toFixed(2)
            });

            // Update the marker position
            if (this.marker) {
              this.marker.setLatLng([lat, lng]); // Update the marker position

              // Construct the popup content with latitude and longitude data
              const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;

              // Bind the popup content to the marker
              this.marker.bindPopup(popupContent).openPopup();
            }
          });
        })
        .catch(error => {
          console.error("Error fetching GeoJSON data:", error);
        });
    }
  }


  fetchAirports() {
    this.http.get<any>('https://nocas-3ab54-default-rtdb.europe-west1.firebasedatabase.app/airportsData.json')
      .subscribe({
        next: (res) => {
          this.airports = res;
        },
        error: (err) => {
          alert("error while fetching the data");
        }
      })
  }
} 