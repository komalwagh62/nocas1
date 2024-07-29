import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as L from 'leaflet';
import { ApiService } from '../Shared/Api/api.service';
import { Router } from '@angular/router';
import * as domtoimage from 'dom-to-image';
import { NgModule } from '@angular/core';
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
  airportCoordinates: [number, number] = [0, 0];
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
  nearestAirportGeoJSONLayer: any;
  isFetchingGeoJSON = false;
  airportName!: string;
  distance!: number;
  isDefaultElevationSelected: boolean = false;
  constructor(public apiservice: ApiService, private formbuilder: FormBuilder, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.TopElevationForm = this.formbuilder.group({
      Latitude: [''],
      Longitude: [''],
      CITY: [''],
      location: ['manual'],
      Site_Elevation: new FormControl('', [Validators.required, Validators.pattern(/^[0-5]+(?:\.[0-5]+)?$/)]),
      elevationOption: ['known', Validators.required],
      snapshot: [''],
      airportName: [''],
      selectionMode: ['']
    });
    this.TopElevationForm.get('selectionMode')?.valueChanges.subscribe((selectionMode: string) => {
      if (selectionMode === 'manual') {
        this.TopElevationForm.addControl('CITY', new FormControl('', Validators.required));
        this.TopElevationForm.addControl('airportName', new FormControl(''));
      } else if (selectionMode === 'default') {
        this.TopElevationForm.addControl('CITY', new FormControl('', Validators.required));
        this.TopElevationForm.addControl('airportName', new FormControl(''));
      }
    });
    this.TopElevationForm.get('Latitude').valueChanges.subscribe((latitudeDMS: string) => {
      const lat = this.convertDMSStringToDD(latitudeDMS);
      this.updateMarkersPosition(lat, this.long);
    });
    this.TopElevationForm.get('Longitude').valueChanges.subscribe((longitudeDMS: string) => {
      const lng = this.convertDMSStringToDD(longitudeDMS);
      this.updateMarkersPosition(this.lat, lng);
    });
    this.TopElevationForm.get('CITY').valueChanges.subscribe((city: string) => {
      this.city = city;
      this.filteredAirports = this.airports.filter(airport => airport.airport_city === city);
      if (this.filteredAirports.length > 1) {
        this.TopElevationForm.addControl('airportName', new FormControl('', Validators.required));
      } else {
        this.TopElevationForm.removeControl('airportName');
      }
      const selectedAirport = this.filteredAirports.length === 1 ? this.filteredAirports[0] : null;
      this.selectedAirport = selectedAirport;
      this.selectedAirportName = selectedAirport ? selectedAirport.airport_name : '';
      this.selectedAirportIcao = selectedAirport ? selectedAirport.airport_icao : '';
      this.selectedAirportIATA = selectedAirport ? selectedAirport.airport_iata : '';
      if (['Coimbatore', 'Mumbai', 'Puri', 'Ahmedabad', 'Akola', 'Chennai', 'Delhi', 'Guwahati', 'Hyderabad', 'Jaipur', 'Nagpur', 'Thiruvananthapuram', 'Vadodara', 'Varanasi', 'Agatti', 'Ambikapur', 'Aurangabad', 'Balurghat', 'Belgaum', 'Aligarh', 'Amritsar', 'Azamgarh', 'Baramati', 'Berhampur'].includes(city)) {
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
            const formData = new FormData();
            formData.append('screenshot', blob, 'mapScreenshot.png');
            this.http.post('http://localhost:3001/api/nocas/save-screenshot', formData).subscribe(
              (response: any) => {
                resolve(response.filePath);
              },
              error => {
                console.error('Error saving screenshot:', error);
                reject('Error saving screenshot');
              }
            );
          })
          .catch(error => {
            // console.error('Error converting element to Blob:', error);
            // reject('Error converting element to Blob');
          });
      } else {
        // console.error('Map element not found');
        // reject('Map element not found');
      }
    });
  }

  convertDDtoDMS(dd: number, isLatitude: boolean): string {
    const dir = dd < 0 ? (isLatitude ? 'S' : 'W') : (isLatitude ? 'N' : 'E');
    const absDd = Math.abs(dd);
    const degrees = Math.floor(absDd);
    const minutesNotTruncated = (absDd - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.round((minutesNotTruncated - minutes) * 60);
    const dms = `${degrees}°${minutes}'${seconds}"${dir}`;
    return dms;
  }

  hideData() {
    const airportCITY = this.TopElevationForm.get('CITY')?.value;
    const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
    const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
    if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
      this.updateMarkerPosition();
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
          subscription_type: 'OneTime',
          price: 50,
          razorpay_payment_id: response.razorpay_payment_id,
          expiry_date: new Date().toISOString(),
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
        if (confirmation) {
          this.isSubscribed = true
        }
        this.router.navigate(['C_NOCAS-MAP']);
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
      // console.error('Payment error:', error);
      alert("Payment Failed");
    });
  }

  airportCoordinatesList: Array<[number, number, string, string]> = [
    [19.79, 85.75, 'Puri', 'PURI AIRPORT/Puri/BBI'],
    [11.03, 77.04, 'Coimbatore', 'Coimbatore International Airport/Coimbatore/CJB'],
    [19.08, 72.86, 'Mumbai', 'Chhatrapati Shivaji Maharaj International Airport/Mumbai/BOM'],
    [23.07, 72.63, 'Ahmedabad', 'Sardar Vallabhbhai Patel International Airport/Ahmedabad/AMD'],
    [20.70, 77.06, 'Akola', 'Akola Airport/Akola/AKD'],
    [13.00, 80.18, 'Chennai', 'Chennai International Airport/Chennai/MAA'],
    [28.30, 77.10, 'Delhi', 'Indira Gandhi International Airport/Delhi/DEL'],
    [26.10, 91.58, 'Guwahati', 'Lokpriya Gopinath Bordoloi International Airport/Guwahati/GAU'],
    [17.24, 78.43, 'Hyderabad', 'Rajiv Gandhi International Airport/Hyderabad/HYD'],
    [26.91, 75.80, 'Jaipur', 'Jaipur International Airport/Jaipur/JAI'],
    [21.09, 79.05, 'Nagpur', 'Dr. Babasaheb Ambedkar International Airport/Nagpur/NAG'],
    [8.48, 76.92, 'Thiruvananthapuram', 'Trivandrum International Airport/Thiruvananthapuram/TRV'],
    [22.32, 73.21, 'Vadodara', 'Vadodara Airport/Vadodara/BDQ'],
    [25.45, 82.86, 'Varanasi', 'Lal Bahadur Shastri International Airport/Varanasi/VNS'],
    [10.82, 72.18, 'Agatti', 'Agatti Aerodrome/Agatti Island/AGX'],
    [23.13, 83.20, 'Ambikapur', 'Ambikapur Airport/Ambikapur/VER'],
    [19.86, 75.39, 'Aurangabad', 'Aurangabad Airport/Aurangabad/IXU'],
    [25.27, 88.77, 'Balurghat', 'Balurghat Airport/Balurghat/RGH'],
    [15.85, 74.62, 'Belgaum', 'Belgaum Airport/Belgaum/IXG'],
    [27.88, 78.08, 'Aligarh', 'Aligarh Airport/Aligarh/IXC'],
    [31.71, 74.80, 'Amritsar', 'Sri Guru Ram Dass Jee International Airport/Amritsar/ATQ'],
    [26.06, 83.18, 'Azamgarh', 'Azamgarh Airport/Azamgarh/'],
    [18.16, 74.57, 'Baramati', 'Baramati Airport/Baramati/'],
    [19.31, 84.79, 'Berhampur', 'Berhampur Airport/Berhampur/'],
  ];

  onElevationOptionChange() {
    const elevationOptionControl = this.TopElevationForm.get('elevationOption');
    let defaultElevation = null;
    if (elevationOptionControl && elevationOptionControl.value === 'unknown') {
      this.showAlert = true;
      this.isDefaultElevationSelected = true;
      const cityElevationMap: { [key: string]: number } = {
        'Coimbatore': 10,
        'Mumbai': 22,
        'Puri': 22,
        'Ahmedabad': 55,
        'Akola': 308,
        'Chennai': 16,
        'Delhi': 239,
        'Guwahati': 49,
        'Hyderabad': 542,
        'Jaipur': 390,
        'Nagpur': 317,
        'Thiruvananthapuram': 5,
        'Vadodara': 39,
        'Varanasi': 82,
        'Agatti': 4,
        'Ambikapur': 623,
        'Aurangabad': 582,
        'Balurghat': 25,
        'Belgaum': 751,
        'Aligarh': 178,
        'Amritsar': 234,
        'Azamgarh': 80,
        'Baramati': 307,
        'Berhampur': 9
      };
      defaultElevation = cityElevationMap[this.city] || 0;
      this.TopElevationForm.patchValue({ Site_Elevation: defaultElevation });
      alert("Users shall enter site elevation value received from WGS-84 survey report. Permissible height will be calculated based on site elevation entered by user. In absence of site elevation value from user, ARP (Airport) elevation value will be used as default.");
    } else {
      this.showAlert = false;
      this.isDefaultElevationSelected = false;
    }
  }

  submitForm() {
    if (!this.apiservice.token) {
      alert('Please Login First');
      this.router.navigate(['UsersLogin']);
      return;
    }
    if (!this.TopElevationForm.valid) {
      return;
    }
    const selectedAirportCITY = this.TopElevationForm.get('CITY')?.value;
    const currentLat = this.TopElevationForm.get('Latitude')?.value;
    const currentLng = this.TopElevationForm.get('Longitude')?.value;
    const nearestAirport = this.findNearestAirport(currentLat, currentLng, 30); // 30 km
    if (nearestAirport && nearestAirport.airportCity !== selectedAirportCITY) {
      const updateConfirmation = confirm(
        `The selected airport (${selectedAirportCITY}) is different from the nearest airport (${nearestAirport.airportCity}).\n` +
        `Would you like to update to the nearest airport or continue with the current selection?`
      );
      if (updateConfirmation) {
        this.TopElevationForm.patchValue({
          CITY: nearestAirport.airportCity,
          Site_Elevation: this.isDefaultElevationSelected ? nearestAirport.elevation : this.TopElevationForm.get('Site_Elevation')?.value // Update only if default elevation is selected
        });
        this.selectedAirportName = nearestAirport.airportName;
        this.loadNearestAirportGeoJSON(nearestAirport.airportCity, nearestAirport.distance, this.map);
      }
    }
    const confirmation = confirm("Kindly confirm that the entered site information is correct or verify");
    if (confirmation) {
      this.captureScreenshot().then(() => {
        this.createNocas();
        this.showData();
      });
    }
  }

  findNearestAirport(lat: number, lng: number, radius: number): { airportCity: string; airportName: string; distance: number; elevation: number } | null {
    const airports = this.airportCoordinatesList;
    let closestAirport = null;
    let minDistance = radius;
    for (const [airportLat, airportLng, airportCity, airportName] of airports) {
      const distance = this.calculateDistance(lat, lng, airportLat, airportLng);
      if (distance < minDistance) {
        closestAirport = {
          airportCity,
          airportName,
          distance,
          elevation: this.getElevationForCity(airportCity)
        };
        minDistance = distance;
      }
    }
    return closestAirport;
  }

  getElevationForCity(city: string): number {
    const cityElevationMap: { [key: string]: number } = {
      'Coimbatore': 10,
      'Mumbai': 22,
      'Puri': 22,
      'Ahmedabad': 55,
      'Akola': 308,
      'Chennai': 16,
      'Delhi': 239,
      'Guwahati': 49,
      'Hyderabad': 542,
      'Jaipur': 390,
      'Nagpur': 317,
      'Thiruvananthapuram': 5,
      'Vadodara': 39,
      'Varanasi': 82,
      'Agatti': 4,
      'Ambikapur': 623,
      'Aurangabad': 582,
      'Balurghat': 25,
      'Belgaum': 751,
      'Aligarh': 178,
      'Amritsar': 234,
      'Azamgarh': 80,
      'Baramati': 307,
      'Berhampur': 9
    };
    return cityElevationMap[city] || 0;
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
    this.closeModal('airportModal');
    if (!this.isSubscribed) {
      this.showModal('outsideMapData');
      this.closeModal('airportModal');
    }
    else {
      this.closeModal('airportModal')
    }
  }

  async createNocas(subscription_id: string = "") {
    if (this.TopElevationForm.valid) {
      try {
        const screenshotPath = await this.captureScreenshot();
        const lat = parseFloat(this.TopElevationForm.value.Latitude);
        const lng = parseFloat(this.TopElevationForm.value.Longitude);
        const distance = this.calculateDistance(lat, lng, this.airportCoordinates[0], this.airportCoordinates[1]);
        const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
          return layer.getBounds().contains([lat, lng]);
        });
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
        this.http.post("http://localhost:3001/api/nocas/createNocas", requestBody, { headers: headers })
          .subscribe(
            (resultData: any) => {
              if (resultData.isSubscribed || resultData.freeTrialCount > 0 || resultData.isOneTimeSubscription) {
                this.isSubscribed = true;
              } else {
                this.isSubscribed = false;
              }
            },
            (error: any) => {
                alert("Session expired. Please log in again.");
                localStorage.removeItem('userData');
                localStorage.removeItem('token');
                this.router.navigate(['UsersLogin']);
            }
          );
      } catch (error) {
        // console.error("Error capturing and saving screenshot:", error);
        alert("Failed to capture and save screenshot. Please try again.");
      }
    } else {
      alert("Please fill out all required fields in the form.");
    }
  }

  displayMapData(lat: number, lng: number, airportCoordinates: [number, number]) {
    const latitudeDD = this.convertDMSToDD(this.lat, true);
    const longitudeDD = this.convertDMSToDD(this.long, false);
    const newDistance = this.calculateDistance(latitudeDD, longitudeDD, airportCoordinates[0], airportCoordinates[1]);
    const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
      if (layer.getBounds().contains([this.lat, this.long])) {
      }
      return layer.getBounds().contains([this.lat, this.long]);
    });
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
      this.handleAirportModalOK();
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
    const top2ClosestAirports = allAirports.slice(0, 3);
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
      this['selectedAirportCoordinates'] = [airport[0], airport[1]];
    }
  }

  showData() {
    const airportCITY = this.TopElevationForm.get('CITY')?.value;
    const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
    const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);
    if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
      this.updateMarkerPosition();
      this.displayMapData(latitude, longitude, this.airportCoordinates);
      this.showMap(latitude, longitude);
    }
  }

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
          this.TopElevationForm.patchValue({
            Latitude: this.latitudeDMS,
            Longitude: this.longitudeDMS
          });
        },
        (error) => {
          // console.error('Error getting user location:', error);
          alert('Error getting user location. Please make sure location services are enabled and try again.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  updateMarkerPosition() {
    if (this.marker) {
      this.latitudeDMS = this.convertDDtoDMS(this.lat, true);
      this.longitudeDMS = this.convertDDtoDMS(this.long, false);
      this.marker.setLatLng([this.lat, this.long]);
    }
    const nearestAirport = this.findNearestAirport(this.lat, this.long, 30); // 30 km
    if (nearestAirport) {
      this.loadNearestAirportGeoJSON(nearestAirport.airportCity, nearestAirport.distance, this.map);
    }
  }

  showDefaultMap() {
    const defaultLat = 0.0;
    const defaultLong = 0.0;
    this.lat = defaultLat;
    this.long = defaultLong;
    this.showMap(this.lat, this.long);
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
    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.lat = lat;
      this.lat = lat;
      this.long = lng;
      this.latitudeDMS = this.convertDDtoDMS(lat, true);
      this.longitudeDMS = this.convertDDtoDMS(lng, false);
      this.updateMarkerPosition();
      const nearestAirport = this.findNearestAirport(lat, lng, 30); // 30 km
      if (nearestAirport) {
        console.log(`Nearest Airport: ${nearestAirport.airportCity}, Distance: ${nearestAirport.distance}`);
        if (nearestAirport.distance <= 30) {
          this.loadNearestAirportGeoJSON(nearestAirport.airportCity, nearestAirport.distance, this.map);
        } else {
          console.log('Nearest airport is more than 30 km away.');
        }
      }
      this.TopElevationForm.patchValue({
        Latitude: this.latitudeDMS,
        Longitude: this.longitudeDMS
      });
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
        const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
        this.marker.bindPopup(popupContent).openPopup();
      }
    });
    this.marker.on('dragend', (e: any) => {
      this.updateMarkerPopupContent(lat, lng);
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
    const nearestAirport = this.findNearestAirport(lat, lng, 30); // 30 km
    if (nearestAirport) {
      if (nearestAirport.distance <= 30) {
        this.loadNearestAirportGeoJSON(nearestAirport.airportCity, nearestAirport.distance, this.map);
      } 
    }
  }

  showModal(id: string): void {
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
      this.geojsonLayer.clearLayers();
      this.geojsonLayer = null;
    }
    const selectedAirportCITY = this.TopElevationForm.get('CITY')?.value;
    if (this.marker) {
      map.removeLayer(this.marker);
      this.marker = null;
    }
    if (selectedAirportCITY) {
      let airportGeoJSONPath: string;
      switch (selectedAirportCITY) {
        case 'Coimbatore':
          airportGeoJSONPath = 'assets/GeoJson/Coimbatore.geojson';
          this.airportCoordinates = [11.03, 77.04];
          break;
        case 'Mumbai':
          airportGeoJSONPath = 'assets/GeoJson/Mumbai.geojson';
          this.airportCoordinates = [19.08, 72.86];
          break;
        case 'Puri':
          airportGeoJSONPath = 'assets/GeoJson/Puri.geojson';
          this.airportCoordinates = [19.79, 85.75];
          break;
        case 'Ahmedabad':
          airportGeoJSONPath = 'assets/GeoJson/Ahemdabad.geojson';
          this.airportCoordinates = [23.07, 72.63];
          break;
        case 'Akola':
          airportGeoJSONPath = 'assets/GeoJson/Akola.geojson';
          this.airportCoordinates = [20.70, 77.06];
          break;
        case 'Chennai':
          airportGeoJSONPath = 'assets/GeoJson/Chennai.geojson';
          this.airportCoordinates = [13.00, 80.18];
          break;
        case 'Delhi':
          airportGeoJSONPath = 'assets/GeoJson/Delhi.geojson';
          this.airportCoordinates = [28.30, 77.10];
          break;
        case 'Guwahati':
          airportGeoJSONPath = 'assets/GeoJson/Guwahati.geojson';
          this.airportCoordinates = [26.10, 91.58];
          break;
        case 'Hyderabad':
          airportGeoJSONPath = 'assets/GeoJson/Hydrabad.geojson';
          this.airportCoordinates = [17.24, 78.43];
          break;
        case 'Jaipur':
          airportGeoJSONPath = 'assets/GeoJson/Jaipur.geojson';
          this.airportCoordinates = [26.91, 75.80];
          break;
        case 'Nagpur':
          airportGeoJSONPath = 'assets/GeoJson/Nagpur.geojson';
          this.airportCoordinates = [21.09, 79.05];
          break;
        case 'Thiruvananthapuram':
          airportGeoJSONPath = 'assets/GeoJson/Trivendrum.geojson';
          this.airportCoordinates = [8.48, 76.92];
          break;
        case 'Vadodara':
          airportGeoJSONPath = 'assets/GeoJson/Vadodara.geojson';
          this.airportCoordinates = [22.32, 73.21];
          break;
        case 'Varanasi':
          airportGeoJSONPath = 'assets/GeoJson/Varanasi.geojson';
          this.airportCoordinates = [25.45, 82.86];
          break;
        case 'Agatti':
          airportGeoJSONPath = 'assets/GeoJson/Agatti.geojson';
          this.airportCoordinates = [10.83, 72.18];
          break;
        case 'Ambikapur':
          airportGeoJSONPath = 'assets/GeoJson/Ambikapur.geojson';
          this.airportCoordinates = [23.13, 83.20];
          break;
        case 'Aurangabad':
          airportGeoJSONPath = 'assets/GeoJson/Aurangabad.geojson';
          this.airportCoordinates = [19.86, 75.40];
          break;
        case 'Balurghat':
          airportGeoJSONPath = 'assets/GeoJson/Balurghat.geojson';
          this.airportCoordinates = [25.22, 88.77];
          break;
        case 'Belgaum':
          airportGeoJSONPath = 'assets/GeoJson/Belgaum.geojson';
          this.airportCoordinates = [15.86, 74.51];
          break;
        case 'Aligarh':
          airportGeoJSONPath = 'assets/GeoJson/Aligarh.geojson';
          this.airportCoordinates = [27.89, 78.08];
          break;
        case 'Amritsar':
          airportGeoJSONPath = 'assets/GeoJson/Amritsar.geojson';
          this.airportCoordinates = [31.63, 74.87];
          break;
        case 'Azamgarh':
          airportGeoJSONPath = 'assets/GeoJson/Azamgarh.geojson';
          this.airportCoordinates = [26.07, 83.18];
          break;
        case 'Baramati':
          airportGeoJSONPath = 'assets/GeoJson/Baramati.geojson';
          this.airportCoordinates = [18.10, 74.57];
          break;
        case 'Berhampur':
          airportGeoJSONPath = 'assets/GeoJson/Berhampur.geojson';
          this.airportCoordinates = [19.32, 84.80];
          break;
        default:
          console.error("Invalid airport city name.");
          return;
      }
      fetch(airportGeoJSONPath)
        .then(response => response.json())
        .then(geojsonData => {
          const features = geojsonData.features;
          const style = (feature: any) => {
            const color = feature.properties.Color;
            return { fillColor: color, weight: 2 };
          };
          const geojsonLayer = L.geoJSON(features, { style: style });
          geojsonLayer.addTo(map);
          this.geojsonLayer = geojsonLayer;
          map.fitBounds(geojsonLayer.getBounds());
          let customIcon = L.icon({
            iconUrl: 'assets/marker-airport.png',
            shadowUrl: 'https://opentopomap.org/leaflet/images/marker-shadow.png',
            iconSize: [40, 41],
            shadowSize: [40, 41],
            iconAnchor: [12, 40],
          });
          this.marker2 = L.marker(this.airportCoordinates, { icon: customIcon }).addTo(map);
          const popupContent = `ARP:
            <p>${selectedAirportCITY} Airport</p><br>
            Latitude: ${this.airportCoordinates[0].toFixed(2)}
            Longitude: ${this.airportCoordinates[1].toFixed(2)}`;
          this.marker2.bindPopup(popupContent).openPopup();
          if (this.marker) {
            map.removeLayer(this.marker);
            this.marker = null;
          }
          this.marker = L.marker([this.lat, this.long]).addTo(map);
          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            this.TopElevationForm.patchValue({
              Latitude: lat,
              Longitude: lng
            });
            
            if (this.marker) {
              this.marker.setLatLng([lat, lng]);
              const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
              this.marker.bindPopup(popupContent).openPopup();
            }
            const nearestAirport = this.findNearestAirport(lat, lng, 30); // 30 km
            if (nearestAirport) {
              if (nearestAirport.distance <= 30) {
                this.loadNearestAirportGeoJSON(nearestAirport.airportCity, nearestAirport.distance, map);
              } else {
              }
            }
          });
        })
        .catch(error => {
          // console.error("Error fetching GeoJSON data:", error);
        });
    }
  }

  loadNearestAirportGeoJSON(airportCity: string, distance: number, map: any) {
    const airportGeoJSONPath = `assets/GeoJson/${airportCity}.geojson`;
    if (this.isFetchingGeoJSON) {
        return;
    }
    this.isFetchingGeoJSON = true;
    if (this.nearestAirportGeoJSONLayer) {
        map.removeLayer(this.nearestAirportGeoJSONLayer);
        this.nearestAirportGeoJSONLayer = null;
    }

    fetch(airportGeoJSONPath)
        .then(response => response.json())
        .then(geojsonData => {
            const features = geojsonData.features;
            if (!features || features.length === 0) {
                console.error("No features found in GeoJSON data.");
                return;
            }
            
            const style = (feature: any) => {
                const color = feature.properties.Color;
                return { fillColor: color, weight: 1 };
            };
            const geojsonLayer = L.geoJSON(features, { style: style });
            geojsonLayer.addTo(map);
            this.nearestAirportGeoJSONLayer = geojsonLayer;
            
            const [lng, lat] = features[0].geometry.coordinates;
            console.log(`Setting marker2 at coordinates: Latitude: ${lat}, Longitude: ${lng}`);
            
            if (this.marker2) {
                this.marker2.setLatLng([lat, lng]);
                const popupContent = `ARP:
                <p>${airportCity} Airport</p><br>
                Latitude: ${lat.toFixed(2)}
                Longitude: ${lng.toFixed(2)}`;
                this.marker2.bindPopup(popupContent).openPopup();
            } else {
                console.error("marker2 is not initialized.");
            }

            const selectionMode = this.TopElevationForm.get('selectionMode')?.value;
            if (selectionMode === 'default') {
                this.TopElevationForm.patchValue({
                    CITY: airportCity,
                    AIRPORT_NAME: features[0].properties.AirportName
                });
            }
        })
        .catch(error => {
            console.error("Error fetching GeoJSON data:", error);
        })
        .finally(() => {
            this.isFetchingGeoJSON = false;
        });
}



  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  fetchAirports() {
    this.http.get<any>('http://localhost:3001/api/airports').subscribe({
      next: (res) => {
        if (res && res.airports) {
          this.airports = res.airports;
        } else {
          // console.error('Unexpected response structure:', res);
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


