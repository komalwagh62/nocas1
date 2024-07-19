import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as L from 'leaflet';
import { ApiService } from '../Shared/Api/api.service';
import { Router } from '@angular/router';
import * as domtoimage from 'dom-to-image';
import { User } from '../Shared/Model/users/users';

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
  filteredAirports: any[] = []; 
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
  public isCheckboxSelected: boolean = false;
  public insideMapData = { elevation: "", permissibleHeight: "", latitudeDMS: "", longitudeDMS: "", newDistance: "" }
  public outsideMapData = { airport_name: "", latitudeDMS: "", longitudeDMS: "", newDistance: "" }
  public closestAirportList: { airportCity: string, airportName: string, distance: number }[] = [];

  constructor(public apiservice: ApiService, private formbuilder: FormBuilder, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.TopElevationForm = this.formbuilder.group({
      Latitude: [''],
      Longitude: [''],
      CITY: ['', [Validators.required]], // Ensure required validator is set
      location: ['manual'],
      Site_Elevation: new FormControl('', [Validators.required, Validators.pattern(/^[0-5]+(?:\.[0-5]+)?$/)]),
      elevationOption: ['known', Validators.required],
      snapshot: [''],
      airportName: [''] // Add a control for the additional dropdown
    });

    this.TopElevationForm.get('Latitude').valueChanges.subscribe((latitudeDMS: string) => {
      const lat = this.convertDMSStringToDD(latitudeDMS);
      console.log(lat);
      this.updateMarkersPosition(lat, this.long);
    });

    this.TopElevationForm.get('Longitude').valueChanges.subscribe((longitudeDMS: string) => {
      const lng = this.convertDMSStringToDD(longitudeDMS);
      console.log(lng);
      this.updateMarkersPosition(this.lat, lng);
    });

    

    this.TopElevationForm.get('CITY').valueChanges.subscribe((city: string) => {
      console.log('City changed:', city);
      this.city = city;
      this.filteredAirports = this.airports.filter(airport => airport.airport_city === city);

      if (this.filteredAirports.length > 1) {
        this.TopElevationForm.addControl('airportName', new FormControl('', Validators.required));
      } else {
        this.TopElevationForm.removeControl('airportName');
      }

      const selectedAirport = this.filteredAirports.length === 1 ? this.filteredAirports[0] : null;
      this.selectedAirport = selectedAirport;
      console.log('Selected airport:', selectedAirport);

      this.selectedAirportName = selectedAirport ? selectedAirport.airport_name : '';
      this.selectedAirportIcao = selectedAirport ? selectedAirport.airport_icao : '';
      this.selectedAirportIATA = selectedAirport ? selectedAirport.airport_iata : '';

      if (['Coimbatore', 'Mumbai', 'Puri', 'Ahmedabad', 'Akola', 'Chennai', 'Delhi', 'Guwahati', 'Hyderabad', 'Jaipur', 'Nagpur', 'Thiruvananthapuram', 'Vadodara', 'Varanasi'].includes(city)) {
        this.loadGeoJSON(this.map);
      } else {
        if (this.geojsonLayer) {
          this.map.removeLayer(this.geojsonLayer);
        }
      }
    });

    this.TopElevationForm.get('airportName')?.valueChanges.subscribe((airportName: string) => {
      const selectedAirport = this.airports.find(airport => airport.airport_name === airportName);
      this.selectedAirport = selectedAirport;
      console.log('Selected airport:', selectedAirport);

      this.selectedAirportIcao = selectedAirport ? selectedAirport.airport_icao : '';
      this.selectedAirportIATA = selectedAirport ? selectedAirport.airport_iata : '';
    });

    this.fetchAirports();
    this.showDefaultMap();
  }
  
  
  
  
  convertDMSStringToDD(dmsString: string): number {
    const parts = dmsString.split(/[^\d\w]+/);
    const degrees = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    const direction = parts[3];
    return this.convertDMSsToDD(degrees, minutes, seconds, direction);
  }
  captureScreenshot(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const mapElement = document.getElementById('map');
      if (mapElement) {
        domtoimage.toBlob(mapElement)
          .then((blob: Blob) => {
            console.log('Blob created:', blob);
  
            const formData = new FormData();
            formData.append('screenshot', blob, 'mapScreenshot.png');
  
            this.http.post('http://localhost:3003/api/nocas/save-screenshot', formData).subscribe(
              (response: any) => {
                console.log('Screenshot saved successfully:', response);
                resolve(response.filePath); // Ensure the server responds with the file path
              },
              error => {
                console.error('Error saving screenshot:', error);
                reject('Error saving screenshot');
              }
            );
          })
          .catch(error => {
            console.error('Error converting element to Blob:', error);
            reject('Error converting element to Blob');
          });
      } else {
        console.error('Map element not found');
        reject('Map element not found');
      }
    });
  }
  

  async createNocas(subscription_id: string = "") {
    if (this.TopElevationForm.valid) {
      try {
        const screenshotPath = await this.captureScreenshot();
        console.log(screenshotPath)
        const lat = parseFloat(this.TopElevationForm.value.Latitude);
        const lng = parseFloat(this.TopElevationForm.value.Longitude);
        const distance = this.calculateDistance(lat, lng, this.airportCoordinates[0], this.airportCoordinates[1]);

        const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
          return layer.getBounds().contains([lat, lng]);
        });

        // this.latitudeDMS = this.convertDDtoDMS(lat, true);
        // this.longitudeDMS = this.convertDDtoDMS(lng, false);
        let permissibleHeight = 0;
        let permissibleElevation = 0;

        if (clickedFeature) {
          const properties = clickedFeature.feature.properties;
          permissibleElevation = parseFloat(properties.name);
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
          snapshot: screenshotPath,
          subscription_id: subscription_id,
        };

        const headers = new HttpHeaders().set("Authorization", `Bearer ${this.apiservice.token}`);
        this.http.post("http://localhost:3003/api/nocas/createNocas", requestBody, { headers: headers })
          .subscribe(
            (resultData: any) => {
              if (resultData.isSubscribed || resultData.freeTrialCount > 0 || resultData.isOneTimeSubscription) {
                this.isSubscribed = true;
              } else {
                this.isSubscribed = false;
                // alert("Your Free trial expired. Please Subscribe Package");
                // this.router.navigate(['PricingPlans']);
              }
            },
            (error: any) => {

              alert("Error creating Nocas entry");
              localStorage.removeItem('userData');
              localStorage.removeItem('token');
              

              // alert("Failed to create Nocas entry. Please check if you are logged in.");
              // this.apiservice.userData = {} as User
              this.router.navigate(['UsersLogin']);
              // window.location.reload();
             
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
    // this.showModals();
    const airportCITY = this.TopElevationForm.get('CITY')?.value;
    const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
    const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
    if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
      // Update the markers and line
      this.updateMarkerPosition();

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
        this.http.post('http://localhost:3003/api/subscription/addSubscription', paymentDetails, { headers: headers })
          .subscribe(
            (result: any) => {
              this.createNocas(result.subscription_id)
            },
            (error: any) => {
              console.error('Error storing payment details:', error);
            }
          );
        const confirmation = confirm("Payment Successfully Done. If you want to see payment details, please go to Transaction Details page");
        if (confirmation) {
          this.isSubscribed = true
        }
        this.router.navigate(['C_NOCAS-MAP']);
        // this.showModal(); // Display the modal after successful creation
        const airportCITY = this.TopElevationForm.get('CITY')?.value;
        const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
        const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
        if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
          this.updateMarkerPosition();
          this.displayMapData(latitude, longitude, this.airportCoordinates);
          this.closeModal('airportModal')
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
      } else if (this.city === 'Ahmedabad') {
        defaultElevation = 55;
      } else if (this.city === 'Akola') {
        defaultElevation = 308;
      } else if (this.city === 'Chennai') {
        defaultElevation = 16;
      } else if (this.city === 'Delhi') {
        defaultElevation = 239;
      } else if (this.city === 'Guwahati') {
        defaultElevation = 49;
      } else if (this.city === 'Hyderabad') {
        defaultElevation = 542;
      } else if (this.city === 'Jaipur') {
        defaultElevation = 390;
      } else if (this.city === 'Nagpur') {
        defaultElevation = 317;
      } else if (this.city === 'Thiruvananthapuram') {
        defaultElevation = 5;
      } else if (this.city === 'Vadodara') {
        defaultElevation = 39;
      } else if (this.city === 'Varanasi') {
        defaultElevation = 82;
      }
      this.TopElevationForm.patchValue({ Site_Elevation: defaultElevation });
      alert("Users shall enter site elevation value received from WGS-84 survey report. Permissible height will be calculated based on site elevation entered by user. In absense of site elevation value from user, ARP (Airport) elevation value will be used as default.")
    }
    else {
      this.showAlert = false;
    }
  }


  airportCoordinatesList: Array<[number, number, string, string]> = [
    [19.79, 85.75, 'Puri', 'PURI AIRPORT/Puri/BBI'],
    [11.03, 77.04, 'Coimbatore', 'Coimbatore International Airport/Coimbatore/CJB'],
    [19.08, 72.86, 'Mumbai', 'Chhatrapati Shivaji Maharaj International Airport/Mumbai/BOM'],
    [23.07, 72.63, 'Ahmedabad', 'Sardar Vallabhbhai Patel International Airport/Ahmedabad/AMD'],
    [20.70, 77.06, 'Akola', 'Akola Airport/Akola/AKD'],
    [13.00, 80.18, 'Chennai', 'Chennai International Airport/Chennai/MAA'],
    [28.56, 77.10, 'Delhi', 'Indira Gandhi International Airport/Delhi/DEL'],
    [26.10, 91.58, 'Guwahati', 'Lokpriya Gopinath Bordoloi International Airport/Guwahati/GAU'],
    [17.24, 78.43, 'Hyderabad', 'Rajiv Gandhi International Airport/Hyderabad/HYD'],
    [26.91, 75.80, 'Jaipur', 'Jaipur International Airport/Jaipur/JAI'],
    [21.09, 79.05, 'Nagpur', 'Dr. Babasaheb Ambedkar International Airport/Nagpur/NAG'],
    [8.48, 76.92, 'Thiruvananthapuram', 'Trivandrum International Airport/Thiruvananthapuram/TRV'],
    [22.32, 73.21, 'Vadodara', 'Vadodara Airport/Vadodara/BDQ'],
    [25.45, 82.86, 'Varanasi', 'Lal Bahadur Shastri International Airport/Varanasi/VNS']
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


  handleAirportModalOK() {
    let latitudeDD = this.convertDMSToDD(this.lat, true);
    let longitudeDD = this.convertDMSToDD(this.long, false);
    this.distance = this.calculateDistance(latitudeDD, longitudeDD, this.airportCoordinates[0], this.airportCoordinates[1]);
    let airport_name = this.selectedAirportName ? this.selectedAirportName.split('/')[0] : '';

    if (!this.isCheckboxSelected) {
      this.outsideMapData = {
        airport_name: airport_name,
        latitudeDMS: this.latitudeDMS,
        longitudeDMS: this.longitudeDMS,
        newDistance: this.distance.toFixed(2)
      };
    }
    this.showModal('outsideMapData');
    this.closeModal('airportModal'); // Close airportModal

    if (!this.isSubscribed) {
      // Show subscription or payment modal here if user is not subscribed
      this.showModal('outsideMapData');
      this.closeModal('airportModal');// Example, replace with your subscription modal logic

    }
    else {
      this.closeModal('airportModal')
    }
  }

  airportName!: string;
  distance!: number;
  displayMapData(lat: number, lng: number, airportCoordinates: [number, number]) {
    console.log(this.lat, this.long, airportCoordinates, "wdefr")

    const latitudeDD = this.convertDMSToDD(this.lat, true);

    const longitudeDD = this.convertDMSToDD(this.long, false);
    console.log(latitudeDD, longitudeDD, "wdr")
    const newDistance = this.calculateDistance(latitudeDD, longitudeDD, airportCoordinates[0], airportCoordinates[1]);
    console.log(this.geojsonLayer.getLayers(), "gvb")
    const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
      if (layer.getBounds().contains([this.lat, this.long])) {
        console.log(layer.getBounds(), "getBounds")
      }

      return layer.getBounds().contains([this.lat, this.long]);
    });

    console.log(clickedFeature, "clicked")
    if (clickedFeature) {

      const properties = clickedFeature.feature.properties;
      const elevation = properties.name;
      const permissibleHeight = parseFloat(properties.name) - parseFloat(this.TopElevationForm.get('Site_Elevation').value);
      if (elevation === 'NOC Required') {
        alert("The selected location requires a **No Objection Certificate (NOC)** for further processing. Please contact our support team for assistance.");
        return;
      }
      this.insideMapData = { elevation: elevation, permissibleHeight: permissibleHeight < 0 ? '-' : Math.abs(permissibleHeight).toFixed(2), latitudeDMS: this.latitudeDMS, longitudeDMS: this.longitudeDMS, newDistance: newDistance.toFixed(2) }
      this.showModal('insideMapData');
    } else {
      this.showClosestAirportList();

    }
  }

  showClosestAirportList() {
    const latitudeDD = this.convertDMSToDD(this.lat, true);
    const longitudeDD = this.convertDMSToDD(this.long, false);
    const allAirports = this.airportCoordinatesList.map((airport) => {
      const [airportLat, airportLng, airportCity, airportName] = airport;
      const distance = this.calculateDistance(latitudeDD, longitudeDD, airportLat, airportLng);
      return { airportCity, airportName, distance };
    });

    allAirports.sort((a, b) => a.distance - b.distance);
    const top2ClosestAirports = allAirports.slice(0, 2);
    this.closestAirportList = top2ClosestAirports

    this.showModal('airportModal')



  }

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
          this.latitudeDMS = this.convertDDtoDMS(this.lat, true);
          this.longitudeDMS = this.convertDDtoDMS(this.long, false);
          const popupContent = `Site Location : <br>  Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
          this.marker.addTo(this.map).bindPopup(popupContent).openPopup();
          this.updateMarkerPosition();

          // Set values in the form in DMS format
          this.TopElevationForm.patchValue({
            Latitude: this.latitudeDMS,
            Longitude: this.longitudeDMS
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
          alert('Error getting user location. Please make sure location services are enabled and try again.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
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
    this.map = L.map('map').setView([19.794444, 85.751111], 5);

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
    // L.control.zoom().addTo(this.map);
    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.lat = lat;
      this.lat = lat;
      this.long = lng;
      this.latitudeDMS = this.convertDDtoDMS(lat, true);
      this.longitudeDMS = this.convertDDtoDMS(lng, false);
      this.updateMarkerPosition();

      this.TopElevationForm.patchValue({
        Latitude: this.latitudeDMS,
        Longitude: this.longitudeDMS
      });
      if (this.marker) {
        this.marker.setLatLng([lat, lng]); // Update the marker position
        // Construct the popup content with latitude and longitude data
        const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
        // Bind the popup content to the marker
        this.marker.bindPopup(popupContent).openPopup();
      }
    });

    this.marker.on('dragend', (e: any) => {
      this.updateMarkerPopupContent(lat, lng); // Set initial popup content
      const position = this.marker.getLatLng();
      this.lat = position.lat;
      this.long = position.lng;
      this.latitudeDMS = this.convertDDtoDMS(position.lat, true);
      this.longitudeDMS = this.convertDDtoDMS(position.lng, false);

      this.TopElevationForm.patchValue({
        Latitude: this.latitudeDMS,
        Longitude: this.longitudeDMS
      });

      this.updateMarkerPosition();


    });
  }

  updateMarkerPopupContent(lat: number, lng: number) {
    this.latitudeDMS = this.convertDDtoDMS(lat, true);
    this.longitudeDMS = this.convertDDtoDMS(lng, false);

    const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
    this.marker.bindPopup(popupContent).openPopup();
  }
  showModal(id: string): void {
    // Code to show the modal
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }
  closeModal(id: string): void {
    const modal = document.getElementById(id);
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

      if (selectedAirportCITY === 'Coimbatore') {
        airportGeoJSONPath = 'assets/GeoJson/Coimbatore.geojson';
        this.airportCoordinates = [11.03, 77.04]; // Coordinates of VOCB
      } else if (selectedAirportCITY === 'Mumbai') {
        airportGeoJSONPath = 'assets/GeoJson/Mumbai.geojson';
        this.airportCoordinates = [19.08, 72.86]; // Coordinates of VABB
      } else if (selectedAirportCITY === 'Puri') {
        airportGeoJSONPath = 'assets/GeoJson/Puri.geojson';
        this.airportCoordinates = [19.79, 85.75]; // Coordinates of VEJH
      } else if (selectedAirportCITY === 'Ahmedabad') {
        airportGeoJSONPath = 'assets/GeoJson/Ahemdabad.geojson';
        this.airportCoordinates = [23.07, 72.63]; // Coordinates of VAAH
      } else if (selectedAirportCITY === 'Akola') {
        airportGeoJSONPath = 'assets/GeoJson/Akola.geojson';
        this.airportCoordinates = [20.70, 77.06]; // Coordinates of VAAK
      } else if (selectedAirportCITY === 'Chennai') {
        airportGeoJSONPath = 'assets/GeoJson/Chennai.geojson';
        this.airportCoordinates = [13.00, 80.18]; // Coordinates of VOMM
      } else if (selectedAirportCITY === 'Delhi') {
        airportGeoJSONPath = 'assets/GeoJson/Delhi.geojson';
        this.airportCoordinates = [28.56, 77.10]; // Coordinates of VIDP
      } else if (selectedAirportCITY === 'Guwahati') {
        airportGeoJSONPath = 'assets/GeoJson/Guwahati.geojson .geojson';
        this.airportCoordinates = [26.10, 91.58]; // Coordinates of VEGT
      } else if (selectedAirportCITY === 'Hyderabad') {
        airportGeoJSONPath = 'assets/GeoJson/Hydrabad.geojson';
        this.airportCoordinates = [17.24, 78.43]; // Coordinates of VOHS
      } else if (selectedAirportCITY === 'Jaipur') {
        airportGeoJSONPath = 'assets/GeoJson/Jaipur.geojson';
        this.airportCoordinates = [26.91, 75.80]; // Coordinates of VIJP
      } else if (selectedAirportCITY === 'Nagpur') {
        airportGeoJSONPath = 'assets/GeoJson/Nagpur.geojson';
        this.airportCoordinates = [21.09, 79.05]; // Coordinates of VANP
      } else if (selectedAirportCITY === 'Thiruvananthapuram') {
        airportGeoJSONPath = 'assets/GeoJson/Trivendrum.geojson';
        this.airportCoordinates = [8.48, 76.92]; // Coordinates of VOTV
      } else if (selectedAirportCITY === 'Vadodara') {
        airportGeoJSONPath = 'assets/GeoJson/Vadodara.geojson';
        this.airportCoordinates = [22.32, 73.21]; // Coordinates of VABO
      } else if (selectedAirportCITY === 'Varanasi') {
        airportGeoJSONPath = 'assets/GeoJson/Varanasi.geojson';
        this.airportCoordinates = [25.45, 82.86]; // Coordinates of VEBN
      } else {
        console.error("Invalid airport city name.");
        return;
      }

      // Fetch the corresponding GeoJSON file
      fetch(airportGeoJSONPath)
        .then(response => response.json())
        .then(geojsonData => {
          const features = geojsonData.features;
          const style = (feature: any) => {
            const color = feature.properties.Color; // Extract color from JSON
            return { fillColor: color, color: 'blue', weight: 1 }; // Define style properties
          };
          const geojsonLayer = L.geoJSON(features, { style: style });
          geojsonLayer.addTo(map);
          this.geojsonLayer = geojsonLayer;
          map.fitBounds(geojsonLayer.getBounds());
          const center = geojsonLayer.getBounds().getCenter();
          map.setView(center, zoomLevel);
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
              Latitude: lat,
              Longitude: lng
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
    this.http.get<any>('http://localhost:3003/api/airports').subscribe({
      next: (res) => {
        // If the response is an object with an 'airports' property
        if (res && res.airports) {
          this.airports = res.airports;
          
          console.log(this.airports);
        } else {
          console.error('Unexpected response structure:', res);
        }
      },
      error: (err) => {
        alert('Error fetching data');
      }
    });
  }


  convertDMSsToDD(degrees: number, minutes: number, seconds: number, direction: string): number {
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
      dd *= -1;
    }
    return dd;
  }

  updateMarkersPosition(lat: number, lng: number): void {
    this.lat = lat;
    this.long = lng;
    this.updateMarkerPosition();
    const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
    this.marker.bindPopup(popupContent).openPopup();
  }



}


