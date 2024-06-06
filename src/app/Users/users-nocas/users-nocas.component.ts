
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as L from 'leaflet';
import { ApiService } from '../Shared/Api/api.service';
import { Router } from '@angular/router';
import html2canvas from 'html2canvas';

import * as domtoimage from 'dom-to-image';
import { saveAs } from 'file-saver';

declare var Razorpay: any;
@Component({
  selector: 'app-users-nocas',
  templateUrl: './users-nocas.component.html',
  styleUrl: './users-nocas.component.scss'
})
export class UsersNOCASComponent implements OnInit {
  [x: string]: any;
  // latitude: any;
  // longitude: any;
  line: any;
  popupContent: any;
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


  constructor(
    public apiservice: ApiService,
    private formbuilder: FormBuilder,
    private http: HttpClient,
    private router: Router // Inject Router
  ) { }


  ngOnInit(): void {
    this.TopElevationForm = this.formbuilder.group({
      Latitude: ['', [Validators.required]],
      Longitude: ['', [Validators.required]],
      CITY: ['', [Validators.required, Validators.nullValidator,]],
      location: ['manual'],
      Site_Elevation: new FormControl('', [Validators.required, Validators.nullValidator, Validators.pattern(/^[0-5]+(?:\.[0-5]+)?$/)]),
      elevationOption: ['known', Validators.required],
      imageData: new FormControl(''),

    });

    this.TopElevationForm.get('Latitude').valueChanges.subscribe((lat: number) => {
      this.lat = lat;
      console.log('Latitude changed:', lat);
      this.updateMarkerPosition();
      // this.updateMarker2Position(lat, this.TopElevationForm.get('Longitude').value);
      this.updatePolyline(lat, this.TopElevationForm.get('Longitude').value);
      this.displayMapData(lat, this.TopElevationForm.get('Longitude').value, this.marker.getLatLng());
    });

    this.TopElevationForm.get('Longitude').valueChanges.subscribe((lng: number) => {
      this.long = lng;
      console.log('Longitude changed:', lng);
      this.updateMarkerPosition();
      // this.updateMarker2Position(this.TopElevationForm.get('Latitude').value, lng);
      this.updatePolyline(this.TopElevationForm.get('Latitude').value, lng);
      this.displayMapData(this.TopElevationForm.get('Latitude').value, lng, this.marker.getLatLng());
    });

    this.TopElevationForm.get('CITY').valueChanges.subscribe((city: string) => {
      console.log('ICAO changed:', city);
      this.city = city; // Set the value of icao when ICAO changes
      const selectedAirport = this.airports.find(airport => airport.airport_city === city);
      this.selectedAirport = selectedAirport;
      this.selectedAirportName = selectedAirport ? selectedAirport.airport_name : '';
      this.selectedAirportIcao = selectedAirport ? selectedAirport.airport_icao : '';
      this.selectedAirportIATA = selectedAirport ? selectedAirport.airport_iata : '';


      // // Set default value for Site_Elevation based on selected city
      // let defaultElevation = null;
      // if (city === 'Coimbatore') {
      //   defaultElevation = 10;
      // } else if (city === 'Mumbai') {
      //   defaultElevation = 22;
      // } else if (city === 'Puri') {
      //   defaultElevation = 22;
      // }
      // this.TopElevationForm.patchValue({ Site_Elevation: defaultElevation });
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
    
    this.updateMarkerPositionOnClick();

  }
  


  
  captureScreenshot() : void {
    const mapElement = document.getElementById('map');
    (domtoimage as any).toBlob(mapElement)
    .then((blob: Blob) => {
      saveAs(blob, 'mapScreenshot.png');
    });
  }
 
  
  



  // createNocas() {
  //   if (this.TopElevationForm.valid) {
  //     const requestBody = {
  //       user_id: this.apiservice.userData.id,
  //       city: this.TopElevationForm.value.CITY,
  //       latitude: this.TopElevationForm.value.Latitude,
  //       longitude: this.TopElevationForm.value.Longitude,
  //       airport_name: this.selectedAirportName,
  //       site_elevation: this.TopElevationForm.value.Site_Elevation,
  //       snapshot:this.TopElevationForm.imageData
  //     };

  //     this.http.post("http://localhost:3001/api/nocas/createNocas", requestBody)
  //       .subscribe(
  //         (resultData: any) => {
  //           console.log("Nocas entry created successfully:", resultData);
  //           alert("Nocas entry created successfully");
  //         },
  //         (error: any) => {
  //           console.error("Error creating Nocas entry:", error);
  //           alert("Failed to create Nocas entry. Please try again.");
  //         }
  //       );
  //   } else {
  //     alert("Please fill out all required fields in the form.");
  //   }
  // }
  hideData() {
    this.showModal();
    const airportCITY = this.TopElevationForm.get('CITY')?.value;
    const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
    const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
    if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
      // Update the markers and line
      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);
      this.updateMarkerPosition();
      this.updatePolyline(latitude, longitude);

      // Update the displayed map data
      this.displayModelData(latitude, longitude, this.airportCoordinates);
      this.showMap(latitude, longitude);
    }

  }
  showData() {
    this.showModal(); // Display the modal after successful creation

    const airportCITY = this.TopElevationForm.get('CITY')?.value;
    const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
    const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
    if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
      // Update the markers and line
      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);
      this.updateMarkerPosition();
      this.updatePolyline(latitude, longitude);

      // Update the displayed map data
      this.displayMapData(latitude, longitude, this.airportCoordinates);
      this.showMap(latitude, longitude);
    }
  }

  createNocas(subscription_id: string = "") {
    if (this.TopElevationForm.valid) {
      const lat = parseFloat(this.TopElevationForm.value.Latitude);
      const lng = parseFloat(this.TopElevationForm.value.Longitude);
      const distance = this.calculateDistance(lat, lng, this.airportCoordinates[0], this.airportCoordinates[1]);
  
      // Retrieve the permissible height and elevation based on the feature's properties
      const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
        return layer.getBounds().contains([lat, lng]);
      });
      
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
        permissible_elevation: permissibleElevation +"M",
        permissible_height: permissibleHeight +"M",
        city: this.TopElevationForm.value.CITY,
        latitude: lat,
        longitude: lng,
        airport_name: this.selectedAirportName,
        site_elevation: this.TopElevationForm.value.Site_Elevation,
        snapshot: this.TopElevationForm.get('imageData').value,
        subscription_id: subscription_id,
      };
      
      console.log(requestBody);
  
      const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
      this.http.post("http://localhost:3001/api/nocas/createNocas", requestBody, { headers: headers })
        .subscribe(
          (resultData: any) => {
            console.log(resultData);
            if(resultData.isSubscribed || resultData.freeTrialCount > 0 || resultData.isOneTimeSubscription){
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
    } else {
      alert("Please fill out all required fields in the form.");
    }
  }
  
  

  displayModelData(lat: number, lng: number, airportCoordinates: [number, number]) {
    const newDistance = this.calculateDistance(lat, lng, airportCoordinates[0], airportCoordinates[1]);
    console.log(newDistance);
    const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
      return layer.getBounds().contains([lat, lng]);
    });
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
                    <b>Site location selected by User is outside CCZM boundary published by AAI. Permissible Elevation calculation could not be processed. Please contact us for further details</b><br><br>
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th scope="row">Site Location</th>
                                <td colspan="2">Latitude: ${lat.toFixed(2)} N <br> Longitude: ${lng.toFixed(2)} E</td>
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

      // Add event listener for the subscribe button
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
        console.log('Payment successful:', response);
        
        
    
          this.router.navigate(['TransactionDetails']); 
        const paymentDetails = {
          user_id: this.apiservice.userData.id,
          subscription_type: 'OneTime', // Replace with actual subscription type
          price: 50, // Replace with actual amount
          razorpay_payment_id: response.razorpay_payment_id,
          expiry_date: new Date().toISOString(),  // Assuming response contains payment ID
          // Add any other relevant payment details here
        };
        console.log(paymentDetails)
        const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);

        // Make API call to your backend to store payment details
        this.http.post('http://localhost:3001/api/subscription/addSubscription', paymentDetails, { headers: headers })
          .subscribe(
            (result: any) => {
              this.createNocas(result.subscription_id)
              console.log('Payment details stored successfully:', result);
              // Handle success response
            },
            (error: any) => {
              console.error('Error storing payment details:', error);
              // Handle error
            }
          );
        // alert("Payment Succesfully Done")
        const confirmation = confirm("Payment Successfully Done. If you want to see payment details, please go to Transaction Details page");
        if (confirmation) {
          // console.log('Form submission cancelled');
          return; // Exit if the user cancels the confirmation
        }
        // this.createNocas(subscription_id);
        this.router.navigate(['C_NOCAS-MAP']);
        this.showModal(); // Display the modal after successful creation
        
        const airportCITY = this.TopElevationForm.get('CITY')?.value;
        const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
        const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
        if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
          // Update the markers and line
          console.log('Latitude:', latitude);
          console.log('Longitude:', longitude);
          this.updateMarkerPosition();
          this.updatePolyline(latitude, longitude);
          // Update the displayed map data
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
    // Open Razorpay payment modal
    rzp.open();

    rzp.on('payment.success', (response: any) => {
      // Make API call to store payment details

    });

    rzp.on('payment.error', (error: any) => {
      console.error('Payment error:', error);
      alert("Payment Failed");
      // Handle payment error
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
      // Hide the alert message otherwise

      this.showAlert = false;

    }
  }


  updateMarkerPositionOnClick(): void {
    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;

      // Update latitude and longitude form fields
      this.TopElevationForm.patchValue({
        Latitude: lat.toFixed(2),
        Longitude: lng.toFixed(2)
      });

      // Update the marker's position
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);

        // Construct the popup content with latitude and longitude data
        const popupContent = `Site Location : <br>Site Latitude: ${lat.toFixed(2)}, Site Longitude: ${lng.toFixed(2)}`;

        // Bind the popup content to the marker
        this.marker.bindPopup(popupContent).openPopup();
      }
    });
  }


  // submitForm() {
  //   // Check if the token exists
  //   if (!this.apiservice.token) {
  //     alert('Please Login First');
  //     // Redirect the user to the login page or take appropriate action
  //     this.router.navigate(['UsersLogin']);
  //     return; // Exit the function if the token does not exist
  //   }


  //   if (!this.TopElevationForm.valid) {
  //     return; // Exit if the form is not valid
  //   }
  //   const confirmation = confirm("Kindly confirm that the entered site information is correct or verify");
  //   if (!confirmation) {
  //     console.log('Form submission cancelled');
  //     return; // Exit if the user cancels the confirmation
  //   }
  //   // fetch('http://localhost:3001/api/subscription/checkSubscriptions', {
  //   //   method: 'GET',
  //   //   headers: {
  //   //     'Content-Type': 'application/json',
  //   //     'Authorization': `Bearer ${this.apiservice.token}`
  //   //   }
  //   // })
  //   //   .then(response => {
  //   //     if (response.ok) {
  //   //       return response.json();
  //   //     } else {
  //   //       // console.error('User is not subscribed.');
  //   //       // Handle user not subscribed
  //   //       alert('You have not subscribed to any package. For more information, please click OK.');
  //   //       this.router.navigate(['PricingPlans']);
  //   //       return null; // Ensure a value is returned
  //   //     }
  //   //   })
  //   //   .then(data => {

  //   //   })
  //   // if (data && data.isSubscribed) {
  //   // User is subscribed, proceed with form submission

  //   this.createNocas();
  //   console.log('Form submitted successfully');


  // }

  submitForm() {
    // Check if the token exists
    if (!this.apiservice.token) {
      alert('Please Login First');
      // Redirect the user to the login page or take appropriate action
      this.router.navigate(['UsersLogin']);
      return; // Exit the function if the token does not exist
    }

    if (!this.TopElevationForm.valid) {
      return; // Exit if the form is not valid
    }

    const confirmation = confirm("Kindly confirm that the entered site information is correct or verify");
    this.captureScreenshot();
    if (!confirmation) {
      console.log('Form submission cancelled');
      return; // Exit if the user cancels the confirmation
    }


    // Call the API to create Nocas entry
    this.createNocas();
  }

  public permissibleElevation!: number ;
public permissibleheight!: number;

displayMapData(lat: number, lng: number, airportCoordinates: [number, number]) {
  const newDistance = this.calculateDistance(lat, lng, airportCoordinates[0], airportCoordinates[1]);
  console.log(newDistance);
  const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
    return layer.getBounds().contains([lat, lng]);
  });
  const mapData = document.getElementById('mapData');
  if (mapData !== null) {
    mapData.innerHTML = '';
    mapData.style.display = 'none';
    const siteElevationInput = this.TopElevationForm.get('Site_Elevation');
    const siteElevation = siteElevationInput ? siteElevationInput.value : 0;
    if (clickedFeature) {
      const properties = clickedFeature.feature.properties;
      const elevation = properties.Name;
      const permissibleheight = parseFloat(properties.Name) - siteElevation;

      // Store permissible elevation and height in the component's state
      this.permissibleElevation = elevation;
      this.permissibleheight = permissibleheight;

      mapData.innerHTML = `
        <table class="table table-hover">
          <tbody>
            <tr>
              <th scope="row">Permissible Elevation<br>(AMSL Above Mean Sea Level)</th>
              <td>${elevation}M</td>
            </tr>
            <tr>
              <th scope="row">Permissible Height<br>(AGL- Above ground level)</th>
              <td>${permissibleheight < 0 ? '-' : ''}${Math.abs(permissibleheight).toFixed(2)}M</td>
            </tr>
            <tr>
              <th scope="row">Site Location</th>
              <td colspan="2">Latitude: ${lat.toFixed(2)} N <br> Longitude: ${lng.toFixed(2)} E</td>
            </tr>
            <tr>
              <th scope="row">Distance<br>(Site Location from ARP)</th>
              <td colspan="2">${newDistance.toFixed(2)} km</td>
            </tr>
          </tbody>
        </table>`;
    } else {
      mapData.innerHTML = `
        <div>
          <b>Site location selected by User is outside CCZM boundary published by AAI. Permissible Elevation calculation could not be processed. Please contact us for further details</b><br><br>
          <table class="table table-hover">
            <tbody>
              <tr>
                <th scope="row">Site Location</th>
                <td colspan="2">Latitude: ${lat.toFixed(2)} N <br> Longitude: ${lng.toFixed(2)} E</td>
              </tr>
              <tr>
                <th scope="row">Distance<br>(Site Location from ARP)</th>
                <td colspan="2">${newDistance.toFixed(2)} km</td>
              </tr>
            </tbody>
          </table>
        </div><br>`;
    }
    mapData.style.display = 'block';
  }
}







  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Location successfully retrieved
          this.lat = position.coords.latitude;
          this.long = position.coords.longitude;
          console.log(this.lat)
          console.log(this.long)



          // Now that you have the location, you can display the popup
          const popupContent = `Site Location : <br>  Site Latitude: ${this.lat.toFixed(2)}, Site Longitude: ${this.long.toFixed(2)}`;
          this.marker.addTo(this.map).bindPopup(popupContent).openPopup();
          // Update the markers and line with the new location
          this.updateMarkerPosition();
          this.updatePolyline(this.lat, this.long);


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
    console.log('Calculating distance with inputs:');
    console.log('Latitude 1:', latitude1);
    console.log('Longitude 1:', longitude1);
    console.log('Latitude 2:', latitude2);
    console.log('Longitude 2:', longitude2);

    const earthRadius = 6371;
    const latitudeDiff = this.degToRad(Math.abs(latitude2 - latitude1));
    const longitudeDiff = this.degToRad(Math.abs(longitude2 - longitude1));

    console.log('Latitude difference:', latitudeDiff);
    console.log('Longitude difference:', longitudeDiff);

    const a = Math.sin(latitudeDiff / 2) * Math.sin(latitudeDiff / 2) +
      Math.cos(this.degToRad(latitude1)) * Math.cos(this.degToRad(latitude2)) *
      Math.sin(longitudeDiff / 2) * Math.sin(longitudeDiff / 2);

    console.log('Value of a:', a);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    console.log('Value of c:', c);

    const distance = earthRadius * c;

    console.log('Calculated distance:', distance);

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

    const popupContent = `Site Location : <br>  Site Latitude: ${lat.toFixed(2)}, Site Longitude: ${lng.toFixed(2)}`;
    this.marker = L.marker([lat, lng]).bindPopup(popupContent).addTo(this.map);
    // this.marker.addTo(this.map).bindPopup(popupContent).openPopup();
    // this.line = L.polyline([[lat, lng], [lat, lng]], { color: 'black' }).addTo(this.map);

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

  loadGeoJSON(map: any) {
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

    // // Remove the existing marker and line if they exist
    if (this.marker) {
      map.removeLayer(this.marker);
      // this.marker = null; // Reset the current location marker
    }
    if (this.line) {
      map.removeLayer(this.line);
      this.line = null; // Reset the polyline
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
          // const geojsonLayer = L.geoJSON(geojsonData);

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

          // Define the custom icon for marker2 with an offset
          let customIcon = L.icon({
            iconUrl: 'https://opentopomap.org/leaflet/images/marker-icon-2x.png',
            shadowUrl: 'https://opentopomap.org/leaflet/images/marker-shadow.png',
            iconSize: [25, 41], // Set the size of the icon [width, height]
            shadowSize: [25, 41], // size of the shadow
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

          // // Draw a line from the selected airport to the current location
          // if (this.lat !=0.0 && this.long!=0.0) {
          //   this.marker = L.marker([this.lat, this.long]).addTo(map);
          //   this.line = L.polyline([this.airportCoordinates, [this.lat, this.long]], { color: 'black' }).addTo(map);
          // }
          this.marker = L.marker([this.lat, this.long]).addTo(map);
          this.line = L.polyline([this.airportCoordinates, [this.lat, this.long]], { color: 'black' }).addTo(map);

          // Fit the map bounds to the GeoJSON layer and the markers
          const bounds = L.latLngBounds([this.airportCoordinates, [this.lat, this.long]]);
          map.fitBounds(bounds);

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
              const popupContent = `Site Location : <br> Site Latitude: ${lat.toFixed(2)}, Site Longitude: ${lng.toFixed(2)}`;

              // Bind the popup content to the marker
              this.marker.bindPopup(popupContent).openPopup();
            }

            // Remove the previous line if it exists
            if (this.line) {
              map.removeLayer(this.line);
            }

            // Draw a new line from the clicked point to the airport
            const selectedAirportCITY = this.TopElevationForm.get('CITY')?.value;
            if (selectedAirportCITY) {
              if (this.airportCoordinates) {
                this.line = L.polyline([[lat, lng], this.airportCoordinates], { color: 'blue' }).addTo(map);
              }
            }
          });
        })
        .catch(error => {
          console.error("Error fetching GeoJSON data:", error);
        });
    }
  }

  clearMapData() {
    // Remove the GeoJSON layer if it exists
    if (this.geojsonLayer) {
      this.map.removeLayer(this.geojsonLayer);
      this.geojsonLayer = null; // Reset the GeoJSON layer
    }

    // Remove the airport marker if it exists
    if (this.marker2) {
      this.map.removeLayer(this.marker2);
      this.marker2 = null; // Reset the airport marker
    }

    // // Remove the current location marker if it exists
    // if (this.marker) {
    //   this.map.removeLayer(this.marker);
    //   this.marker = null; // Reset the current location marker
    // }

    // Remove the polyline if it exists
    if (this.line) {
      this.map.removeLayer(this.line);
      this.line = null; // Reset the polyline
    }

    // Clear the map data container
    const mapData = document.getElementById('mapData');
    if (mapData) {
      mapData.innerHTML = '';
    }

    // Reset the form fields
    // this.TopElevationForm.reset();
  }

  //   displayMapData(lat: number, lng: number, airportCoordinates: [number, number]) {
  //     const newDistance = this.calculateDistance(lat, lng, airportCoordinates[0], airportCoordinates[1]);
  //     const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
  //       return layer.getBounds().contains([lat, lng]);
  //     });
  //     const mapData = document.getElementById('mapData');
  //     if (mapData !== null) {
  //       mapData.innerHTML = '';
  //       mapData.style.display = 'none';
  //       const siteElevationInput = this.TopElevationForm.get('Site_Elevation');
  //       const siteElevation = siteElevationInput ? siteElevationInput.value : 0;
  //       if (clickedFeature) {
  //         const properties = clickedFeature.feature.properties;
  //         const elevation = (properties.Name);
  //         const permissibleHeight = parseFloat(properties.Name) - siteElevation;
  //         mapData.innerHTML = `
  //         <table class="table table-hover">
  //   <tbody>
  //   <tr>
  //       <th scope="row"> Permissible Elevation<br>
  //       (AMSL Above Mean Sea Level)</th>
  //       <td>${elevation}M</td>

  //     </tr>
  //     <tr>
  //       <th scope="row"> Permissible Height<br>
  //       (AGL- Above ground level)
  //       </th>
  //       <td> ${permissibleHeight < 0 ? '-' : ''}${Math.abs(permissibleHeight).toFixed(2)}M</td>

  //     </tr>
  //     <tr>
  //       <th scope="row">Site Location </th>
  //       <td colspan="2" >Latitude: ${lat.toFixed(2)} N <br> Longitude: ${lng.toFixed(2)} E</td>

  //     </tr>
  //     <tr>
  //       <th scope="row">Distance<br>
  //       (Site Location from ARP)</th>
  //       <td colspan="2"> ${newDistance.toFixed(2)} km</td>

  //     </tr>
  //   </tbody>
  // </table> `;
  //       } else {
  //         mapData.innerHTML = `
  //           <div>
  //          <b>Site location selected by User is outside CCZM boundary published by AAI. Permissible Elevation calculation could not be processed. Please contact us for further details</b><br> <br>

  //          <table class="table table-hover">
  //          <tbody>
  //            <tr>
  //              <th scope="row">Site Location</th>
  //              <td colspan="2" >Latitude: ${lat.toFixed(2)} N <br> Longitude: ${lng.toFixed(2)} E</td>
  //            </tr>
  //            <tr>
  //              <th scope="row">Distance<br>
  //              (Site Location from ARP)</th>
  //              <td colspan="2">${newDistance.toFixed(2)} km</td>
  //            </tr>
  //          </tbody>
  //        </table> 
  //           </div> <br>`;
  //       }
  //       mapData.style.display = 'block';
  //     }
  //   }

  updatePolyline(lat: number, lng: number) {
    if (this.line) {
      // Update the line's coordinates using the updated marker's position
      this.line.setLatLngs([[lat, lng], [this.marker2.getLatLng().lat, this.marker2.getLatLng().lng]]);
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
