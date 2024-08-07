import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as L from 'leaflet';
import { ApiService } from '../Shared/Api/api.service';
import { Router } from '@angular/router';
import * as domtoimage from 'dom-to-image';
declare var Razorpay: any;
import { ToastrService } from 'ngx-toastr';


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
  autoSelectAirportCity: boolean = false; // Define the variable here
  constructor(private toastr: ToastrService, public apiservice: ApiService, private formbuilder: FormBuilder, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.TopElevationForm = this.formbuilder.group({
      Latitude: [''],
      Longitude: [''],
      CITY: [''],
      location: [''],
      elevationOption: ['', Validators.required],
      Site_Elevation: [null, [Validators.required, Validators.min(0), Validators.max(9999)]], // Adjusted max value
      snapshot: [''],
      airportName: [''],
      selectionMode: ['']
    });
    this.TopElevationForm.get('selectionMode')?.valueChanges.subscribe((selectionMode: string) => {
      if (selectionMode === 'manual' || selectionMode === 'default') {
        this.TopElevationForm.get('CITY')?.setValidators([Validators.required]);
        this.TopElevationForm.get('airportName')?.setValidators([]);
      } else {
        this.TopElevationForm.get('CITY')?.clearValidators();
        this.TopElevationForm.get('airportName')?.clearValidators();
      }
      if (selectionMode === 'manual') {
        this.TopElevationForm.patchValue({
          CITY: '',
          AIRPORT_NAME: ''
        });
      }
      this.TopElevationForm.get('CITY')?.updateValueAndValidity();
      this.TopElevationForm.get('airportName')?.updateValueAndValidity();
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
      if ([
        'Coimbatore', 'Mumbai', 'Puri', 'Ahmedabad', 'Akola', 'Chennai', 'Delhi', 'Guwahati',
        'Hyderabad', 'Jaipur', 'Nagpur', 'Thiruvananthapuram', 'Vadodara', 'Varanasi', 'Agatti',
        'Ambikapur', 'Aurangabad', 'Balurghat', 'Belgaum', 'Aligarh', 'Amritsar', 'Azamgarh',
        'Baramati', 'Berhampur', 'Bial', 'Cochin', 'Bokaro', 'Birlamgram', 'Bagdogra',
        'Bilaspur', 'Cooch-Behar', 'Durgapur', 'Gorakhpur', 'Deoghar', 'Gaya', 'Hollongi',
        'Imphal', 'Jagdalpur', 'Jamshedpur', 'Jharsuguda', 'Jorhat', 'Kushinagar', 'Khajuraho',
        'Lengpui', 'Lilabari', 'Dibrugarh', 'Dimapur', 'Patna', 'Pakyong', 'Ranchi', 'Rourkela',
        'Raipur', 'Rupsi', 'Tezu', 'Agra', 'Kullu Manali', 'Bareilly', 'Chandigarh',
        'Safdarjung', 'Dehradun', 'Hindan', 'Kangra', 'Hisar', 'Jodhpur', 'Jammu', 'Kishangarh',
        'Ludhiana', 'Leh', 'Lucknow', 'Pithoragarh', 'Pantnagar', 'Shimla', 'Uttarlai', 'Agatti',
        'Bengaluru (HAL)', 'Bengaluru (KIA)', 'Belagavi', 'Bidar', 'Vijaywada', 'Cochin', 'Calicut',
        'Kadapa', 'Mopa', 'Kalaburagi', 'Goa', 'Hubballi', 'Shamshabad (RGI)', 'Begumpet',
        'Jindal Vijayanagar', 'Kannur', 'Kurnool', 'Madurai', 'Mangaluru', 'Mysuru', 'Portblair',
        'Puducherry', 'Puttaparthi', 'Rajahmundry', 'Salem', 'Shivamogga', 'Sindhudurg',
        'Tuticorin', 'Tirupati', 'Tiruchirappalli', 'Visakhapatnam'
      ].includes(city)) {
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
    if (this.marker2) {
      map.removeLayer(this.marker2);
      this.marker2 = null;
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
        case 'Bial':
          airportGeoJSONPath = 'assets/GeoJson/Bial.geojson';
          this.airportCoordinates = [13.21, 77.71];
          break;
        case 'Cochin':
          airportGeoJSONPath = 'assets/GeoJson/Cochin.geojson';
          this.airportCoordinates = [9.93, 76.27];
          break;
        case 'Bokaro':
          airportGeoJSONPath = 'assets/GeoJson/Bokaro.geojson';
          this.airportCoordinates = [23.47, 85.98];
          break;
        case 'Birlamgram':
          airportGeoJSONPath = 'assets/GeoJson/Birlamgram.geojson';
          this.airportCoordinates = [23.45000003, 75.41666669];
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

    if (this.marker2) {
      map.removeLayer(this.marker2);
      this.marker2 = null;
    }

    map.eachLayer((layer: any) => {
      if (layer instanceof L.GeoJSON) {
        map.removeLayer(layer);
      }
    });

    fetch(airportGeoJSONPath)
      .then(response => response.json())
      .then(geojsonData => {
        const features = geojsonData.features;
        const style = (feature: any) => {
          const color = feature.properties.Color;
          return { fillColor: color, weight: 1 };
        };

        const geojsonLayer = L.geoJSON(features, { style: style });
        geojsonLayer.addTo(map);
        this.nearestAirportGeoJSONLayer = geojsonLayer;

        const selectionMode = this.TopElevationForm.get('selectionMode')?.value;
        if (selectionMode === 'default') {
          this.TopElevationForm.patchValue({
            CITY: airportCity,
            AIRPORT_NAME: features[0].properties.AirportName
          });
        }

        this.marker2 = L.marker([features[0].geometry.coordinates[1], features[0].geometry.coordinates[0]]).addTo(map);
        const popupContent = `ARP:
        <p>${airportCity} Airport</p><br>
        Latitude: ${features[0].geometry.coordinates[1].toFixed(2)}
        Longitude: ${features[0].geometry.coordinates[0].toFixed(2)}`;
        this.marker2.bindPopup(popupContent).openPopup();
      })
      .catch(error => {
        console.error("Error fetching GeoJSON data:", error);
      })
      .finally(() => {
        this.isFetchingGeoJSON = false;
      });
  }
  showMissingFieldsAlert() {
    const missingFields = [];
    const controls = this.TopElevationForm.controls;

    for (const name in controls) {
      if (controls[name].invalid) {
        missingFields.push(name);
      }
    }
    alert(`Missing required fields: ${missingFields.join(', ')}`);
    this.toastr.error(`Missing required fields: ${missingFields.join(', ')}`, 'Form Incomplete');
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
    const nearestAirport = this.findNearestAirport(this.lat, this.long, 30); // 30 km
    if (nearestAirport) {
      if (nearestAirport.airportCity !== selectedAirportCITY) {
        const updateConfirmation = confirm(
          `The selected airport (${selectedAirportCITY}) is different from the nearest airport (${nearestAirport.airportCity}).\n` +
          `Would you like to update to the nearest airport or continue with the current selection?`
        );
        if (updateConfirmation) {
          this.TopElevationForm.patchValue({
            CITY: nearestAirport.airportCity,
            Site_Elevation: this.getElevationForCity(nearestAirport.airportCity)
          });
          this.selectedAirportName = nearestAirport.airportName;
          this.loadNearestAirportGeoJSON(nearestAirport.airportCity, nearestAirport.distance, this.map);
        }
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
          elevation: this.getElevationForCity(this.city)
        };
        minDistance = distance;
      }
    }
    return closestAirport;
  }
  updateMarkersPosition(lat: number, lng: number): void {
    this.lat = lat;
    this.long = lng;
    this.updateMarkerPosition();
    this.updateNearestAirportData();
  }

  updateMarkerPosition() {
    if (this.marker) {
      this.latitudeDMS = this.convertDDtoDMS(this.lat, true);
      this.longitudeDMS = this.convertDDtoDMS(this.long, false);
      this.marker.setLatLng([this.lat, this.long]);
      const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
      this.marker.bindPopup(popupContent).openPopup();
    }
  }
  updateNearestAirportData() {
    const nearestAirport = this.findNearestAirport(this.lat, this.long, 30); // 30 km
    const selectionMode = this.TopElevationForm.get('selectionMode')?.value;
    if (selectionMode !== 'manual') {
      if (nearestAirport) {
        this.loadNearestAirportGeoJSON(nearestAirport.airportCity, nearestAirport.distance, this.map);

        this.TopElevationForm.patchValue({
          CITY: nearestAirport.airportCity,
          AIRPORT_NAME: nearestAirport.airportName,
          elevation: this.getElevationForCity(nearestAirport.airportCity)
        });
      }
    }
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
    [11.03, 77.04, 'Coimbatore', 'Coimbatore International Airport/Coimbatore/CJB'],
    [19.08, 72.86, 'Mumbai', 'Chhatrapati Shivaji Maharaj International Airport/Mumbai/BOM'],
    [19.79, 85.75, 'Puri', 'PURI AIRPORT/Puri/BBI'],
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
    [13.20, 77.71, 'Bial', 'Kempegowda International Airport/Bial/BLR'],
    [10.15, 76.40, 'Cochin', 'Cochin International Airport/Cochin/COK'],
    [23.29, 86.36, 'Bokaro', 'Bokaro Airport/Bokaro/IN-0191'],
    [23.59, 75.95, 'Birlamgram', 'Birlamgram Airport/Birlamgram/IN-0130'],
    [22.55, 88.37, 'Bagdogra', 'Bagdogra Airport/Bagdogra/IXB'],
    [22.79, 82.14, 'Bilaspur', 'Bilaspur Airport/Bilaspur/'],
    [25.33, 89.45, 'Cooch-Behar', 'Cooch-Behar Airport/Cooch-Behar/'],
    [23.53, 87.30, 'Durgapur', 'Durgapur Airport/Durgapur/'],
    [26.70, 83.38, 'Gorakhpur', 'Gorakhpur Airport/Gorakhpur/'],
    [24.48, 84.69, 'Deoghar', 'Deoghar Airport/Deoghar/'],
    [25.28, 85.02, 'Gaya', 'Gaya Airport/Gaya/'],
    [27.02, 93.35, 'Hollongi', 'Hollongi Airport/Hollongi/'],
    [24.77, 93.94, 'Imphal', 'Imphal Airport/Imphal/'],
    [19.30, 82.02, 'Jagdalpur', 'Jagdalpur Airport/Jagdalpur/'],
    [22.80, 86.18, 'Jamshedpur', 'Jamshedpur Airport/Jamshedpur/'],
    [21.89, 84.13, 'Jharsuguda', 'Jharsuguda Airport/Jharsuguda/'],
    [26.75, 93.19, 'Jorhat', 'Jorhat Airport/Jorhat/'],
    [26.12, 84.78, 'Kushinagar', 'Kushinagar Airport/Kushinagar/'],
    [25.18, 79.93, 'Khajuraho', 'Khajuraho Airport/Khajuraho/'],
    [23.07, 92.77, 'Lengpui', 'Lengpui Airport/Lengpui/'],
    [27.04, 93.21, 'Lilabari', 'Lilabari Airport/Lilabari/'],
    [27.48, 95.00, 'Dibrugarh', 'Dibrugarh Airport/Dibrugarh/'],
    [25.91, 93.73, 'Dimapur', 'Dimapur Airport/Dimapur/'],
    [25.60, 85.11, 'Patna', 'Patna Airport/Patna/'],
    [27.33, 88.61, 'Pakyong', 'Pakyong Airport/Pakyong/'],
    [23.34, 85.33, 'Ranchi', 'Ranchi Airport/Ranchi/'],
    [22.25, 84.77, 'Rourkela', 'Rourkela Airport/Rourkela/'],
    [21.23, 81.63, 'Raipur', 'Raipur Airport/Raipur/'],
    [26.19, 91.57, 'Rupsi', 'Rupsi Airport/Rupsi/'],
    [27.87, 94.15, 'Tezu', 'Tezu Airport/Tezu/'],
    [27.18, 78.03, 'Agra', 'Agra Airport/Agra/'],
    [32.09, 77.27, 'Kullu Manali', 'Kullu Manali Airport/Kullu Manali/'],
    [28.37, 79.45, 'Bareilly', 'Bareilly Airport/Bareilly/'],
    [30.73, 76.78, 'Chandigarh', 'Chandigarh Airport/Chandigarh/'],
    [28.60, 77.11, 'Safdarjung', 'Safdarjung Airport/Safdarjung/'],
    [30.32, 78.03, 'Dehradun', 'Dehradun Airport/Dehradun/'],
    [28.58, 77.42, 'Hindan', 'Hindan Airport/Hindan/'],
    [32.13, 76.27, 'Kangra', 'Kangra Airport/Kangra/'],
    [29.15, 75.73, 'Hisar', 'Hisar Airport/Hisar/'],
    [26.29, 73.19, 'Jodhpur', 'Jodhpur Airport/Jodhpur/'],
    [32.72, 74.85, 'Jammu', 'Jammu Airport/Jammu/'],
    [26.47, 73.73, 'Kishangarh', 'Kishangarh Airport/Kishangarh/'],
    [30.90, 75.85, 'Ludhiana', 'Ludhiana Airport/Ludhiana/'],
    [34.16, 77.58, 'Leh', 'Leh Airport/Leh/'],
    [26.85, 80.91, 'Lucknow', 'Lucknow Airport/Lucknow/'],
    [29.60, 80.27, 'Pithoragarh', 'Pithoragarh Airport/Pithoragarh/'],
    [79.00, 77.78, 'Pantnagar', 'Pantnagar Airport/Pantnagar/'],
    [31.10, 77.17, 'Shimla', 'Shimla Airport/Shimla/'],
    [23.34, 74.73, 'Uttarlai', 'Uttarlai Airport/Uttarlai/'],
    [12.97, 77.60, 'Bengaluru (HAL)', 'HAL Airport/Bengaluru/HAL'],
    [13.20, 77.71, 'Bengaluru (KIA)', 'Kempegowda International Airport/Bengaluru/KIA'],
    [15.85, 74.59, 'Belagavi', 'Belagavi Airport/Belagavi/IXG'],
    [17.97, 77.55, 'Bidar', 'Bidar Airport/Bidar/'],
    [16.50, 80.62, 'Vijaywada', 'Vijayawada Airport/Vijayawada/VGA'],
    [10.15, 76.40, 'Cochin', 'Cochin International Airport/Cochin/COK'],
    [11.20, 75.95, 'Calicut', 'Calicut International Airport/Calicut/CCJ'],
    [14.46, 76.00, 'Kadapa', 'Kadapa Airport/Kadapa/'],
    [15.59, 73.92, 'Mopa', 'Mopa Airport/Mopa/'],
    [17.15, 76.97, 'Kalaburagi', 'Kalaburagi Airport/Kalaburagi/'],
    [15.30, 74.18, 'Goa', 'Goa International Airport/Goa/GOI'],
    [15.36, 75.13, 'Hubballi', 'Hubballi Airport/Hubballi/'],
    [17.23, 78.43, 'Shamshabad (RGI)', 'Rajiv Gandhi International Airport/Hyderabad/RGI'],
    [17.45, 78.56, 'Begumpet', 'Begumpet Airport/Hyderabad/'],
    [15.07, 77.57, 'Jindal Vijayanagar', 'Jindal Vijayanagar Airport/Vijayanagar/'],
    [11.80, 75.95, 'Kannur', 'Kannur International Airport/Kannur/CCJ'],
    [15.83, 78.05, 'Kurnool', 'Kurnool Airport/Kurnool/'],
    [9.92, 78.13, 'Madurai', 'Madurai Airport/Madurai/IXM'],
    [12.91, 74.84, 'Mangaluru', 'Mangaluru International Airport/Mangaluru/IXE'],
    [12.31, 76.65, 'Mysuru', 'Mysuru Airport/Mysuru/'],
    [11.93, 92.00, 'Portblair', 'Veer Savarkar International Airport/Portblair/IXZ'],
    [11.94, 79.83, 'Puducherry', 'Puducherry Airport/Puducherry/PDY'],
    [14.23, 77.63, 'Puttaparthi', 'Puttaparthi Airport/Puttaparthi/'],
    [17.20, 81.52, 'Rajahmundry', 'Rajahmundry Airport/Rajahmundry/'],
    [11.89, 78.73, 'Salem', 'Salem Airport/Salem/'],
    [13.32, 75.55, 'Shivamogga', 'Shivamogga Airport/Shivamogga/'],
    [16.08, 73.50, 'Sindhudurg', 'Sindhudurg Airport/Sindhudurg/'],
    [8.78, 77.83, 'Tuticorin', 'Tuticorin Airport/Tuticorin/'],
    [13.63, 79.42, 'Tirupati', 'Tirupati Airport/Tirupati/'],
    [10.81, 78.71, 'Tiruchirappalli', 'Tiruchirappalli International Airport/Tiruchirappalli/TRZ'],
    [17.73, 83.31, 'Visakhapatnam', 'Visakhapatnam Airport/Visakhapatnam/VGA'],
    [20.93, 85.85, 'Dessa', 'Dessa Airport/Dessa/'],
    [24.46, 88.62, 'Dilburgarh', 'Dilburgarh Airport/Dilburgarh/'],
    [20.71, 70.91, 'Diu', 'Diu Airport/Diu/DIU'],
    [23.50, 87.30, 'Durgapur', 'Durgapur Airport/Durgapur/'],
    [24.79, 84.98, 'Gaya', 'Gaya Airport/Gaya/GAY'],
    [29.13, 75.73, 'Hisar', 'Hisar Airport/Hisar/'],
    [28.32, 77.40, 'Jewer', 'Jewer Airport/Jewer/'],
    [26.55, 87.95, 'Jogbani', 'Jogbani Airport/Jogbani/'],
    [22.40, 70.10, 'Kandla', 'Kandla Airport/Kandla/IXY']
  ];

  getElevationForCity(city: string): number {
    const cityElevationMap: { [key: string]: number } = {
      'Dessa': 0, // Example elevation, please verify
      'Dilburgarh': this.feetToMeters(360), // Example elevation, please verify
      'Diu': 0, // Example elevation, please verify
      'Hubli': this.feetToMeters(2195), // Example elevation, please verify
      'Jewer': 0, // Example elevation, please verify
      'Jogbani': 0, // Example elevation, please verify
      'Kandla': this.feetToMeters(97), // Example elevation, please verify
      'Puri': this.feetToMeters(22),
      'Coimbatore': this.feetToMeters(10),
      'Mumbai': this.feetToMeters(40),
      'Ahmedabad': this.feetToMeters(189),
      'Akola': this.feetToMeters(308),
      'Chennai': this.feetToMeters(54),
      'Delhi': this.feetToMeters(778),
      'Guwahati': this.feetToMeters(163),
      'Hyderabad': this.feetToMeters(542),
      'Jaipur': this.feetToMeters(1268),
      'Nagpur': this.feetToMeters(1033),
      'Thiruvananthapuram': this.feetToMeters(17),
      'Vadodara': this.feetToMeters(131),
      'Varanasi': this.feetToMeters(270),
      'Agatti': this.feetToMeters(12),
      'Ambikapur': 0, // Elevation data not available, set to 0
      'Aurangabad': this.feetToMeters(1917),
      'Balurghat': 0, // Elevation data not available, set to 0
      'Belgaum': 0, // Elevation data not available, set to 0
      'Aligarh': 0, // Elevation data not available, set to 0
      'Amritsar': this.feetToMeters(760),
      'Azamgarh': 0, // Elevation data not available, set to 0
      'Baramati': 0, // Elevation data not available, set to 0
      'Berhampur': 0, // Elevation data not available, set to 0
      'Bial': this.feetToMeters(2912), // Kempegowda International Airport
      'Cochin': this.feetToMeters(30),
      'Bokaro': 0, // Elevation data not available, set to 0
      'Birlamgram': 0, // Elevation data not available, set to 0
      'Bhopal': this.feetToMeters(1721),
      'Bhavnagar': this.feetToMeters(43),
      'Daman': this.feetToMeters(42),
      'Gondia': this.feetToMeters(994),
      'Rajkot INTL': this.feetToMeters(650),
      'Indore': this.feetToMeters(1854),
      'Jabalpur': this.feetToMeters(1626),
      'Juhu': this.feetToMeters(17),
      'Jalgaon': this.feetToMeters(842),
      'Kondla': this.feetToMeters(97),
      'Kolhapur': this.feetToMeters(2001),
      'Keshod': this.feetToMeters(168),
      'Mundra': this.feetToMeters(17),
      'Ozar': this.feetToMeters(1995),
      'Pune': this.feetToMeters(1943),
      'Porbandar': this.feetToMeters(26),
      'Shirdi': this.feetToMeters(1938),
      'Surat': this.feetToMeters(25),
      'Udaipur': this.feetToMeters(1690),
      'Agartala': this.feetToMeters(56),
      'Ayodhya': this.feetToMeters(329),
      'Barapani': this.feetToMeters(2926),
      'Bagdogra': this.feetToMeters(414),
      'Bhubaneswar': this.feetToMeters(141),
      'Bilaspur': this.feetToMeters(907),
      'Kolkata': this.feetToMeters(20),
      'Cooch-Behar': this.feetToMeters(141),
      'Durgapur': this.feetToMeters(302),
      'Gorakhpur': this.feetToMeters(260),
      'Deoghar': this.feetToMeters(802),
      'Gaya': this.feetToMeters(383),
      'Hollongi': this.feetToMeters(351),
      'Imphal': this.feetToMeters(2544),
      'Jagdalpur': this.feetToMeters(1842),
      'Jamshedpur': this.feetToMeters(481),
      'Jharsuguda': this.feetToMeters(757),
      'Jorhat': this.feetToMeters(299),
      'Kushinagar': this.feetToMeters(263),
      'Khajuraho': this.feetToMeters(731),
      'Lengpui': this.feetToMeters(1406),
      'Lilabari': this.feetToMeters(331),
      'Dibrugarh': this.feetToMeters(360),
      'Dimapur': this.feetToMeters(493),
      'Patna': this.feetToMeters(175),
      'Pakyong': this.feetToMeters(4646),
      'Ranchi': this.feetToMeters(2150),
      'Rourkela': this.feetToMeters(673),
      'Raipur': this.feetToMeters(1044),
      'Rupsi': this.feetToMeters(139),
      'Tezu': this.feetToMeters(770),
      'Agra': this.feetToMeters(550),
      'Kullu Manali': this.feetToMeters(3571),
      'Bareilly': this.feetToMeters(571),
      'Chandigarh': this.feetToMeters(1032),
      'Safdarjung': this.feetToMeters(696),
      'Dehradun': this.feetToMeters(1857),
      'Hindan': this.feetToMeters(703),
      'Kangra': this.feetToMeters(2527),
      'Hisar': this.feetToMeters(701),
      'Jodhpur': this.feetToMeters(712),
      'Jammu': this.feetToMeters(956),
      'Kishangarh': this.feetToMeters(1478),
      'Ludhiana': this.feetToMeters(834),
      'Leh': this.feetToMeters(10839),
      'Lucknow': this.feetToMeters(406),
      'Pithoragarh': this.feetToMeters(4967),
      'Pantnagar': this.feetToMeters(772),
      'Shimla': this.feetToMeters(5073),
      'Uttarlai': this.feetToMeters(505),
      'Bengaluru (HAL)': this.feetToMeters(2912),
      'Bengaluru (KIA)': this.feetToMeters(3002),
      'Belagavi': this.feetToMeters(2489),
      'Bidar': this.feetToMeters(2179),
      'Vijaywada': this.feetToMeters(83),
      'Calicut': this.feetToMeters(343),
      'Kadapa': this.feetToMeters(444),
      'Mopa': this.feetToMeters(564),
      'Kalaburagi': this.feetToMeters(1567),
      'Goa': this.feetToMeters(188),
      'Hubballi': this.feetToMeters(2195),
      'Shamshabad (RGI)': this.feetToMeters(2030),
      'Begumpet': this.feetToMeters(1744),
      'Jindal Vijayanagar': this.feetToMeters(1686),
      'Kannur': this.feetToMeters(344),
      'Kurnool': this.feetToMeters(1129),
      'Madurai': this.feetToMeters(466),
      'Mangaluru': this.feetToMeters(318),
      'Mysuru': this.feetToMeters(2397),
      'Portblair': this.feetToMeters(93),
      'Puducherry': this.feetToMeters(141),
      'Puttaparthi': this.feetToMeters(1569),
      'Rajahmundry': this.feetToMeters(156),
      'Salem': this.feetToMeters(1008),
      'Shivamogga': this.feetToMeters(2069),
      'Sindhudurg': this.feetToMeters(226),
      'Tuticorin': this.feetToMeters(85),
      'Tirupati': this.feetToMeters(352),
      'Tiruchirappalli': this.feetToMeters(292),
      'Visakhapatnam': this.feetToMeters(21)
    };

    return cityElevationMap[city] || 0;
  }

  feetToMeters(feet: number): number {
    return feet * 0.3048;
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
  onElevationOptionChange() {
    const elevationOptionControl = this.TopElevationForm.get('elevationOption');
    let defaultElevation = null;

    if (elevationOptionControl && elevationOptionControl.value === 'unknown') {
      this.showAlert = true;
      if (this.city === 'Coimbatore') {
        defaultElevation = this.feetToMeters(10);
      } else if (this.city === 'Mumbai') {
        defaultElevation = this.feetToMeters(40);
      } else if (this.city === 'Puri') {
        defaultElevation = this.feetToMeters(22);
      } else if (this.city === 'Ahmedabad') {
        defaultElevation = this.feetToMeters(189);
      } else if (this.city === 'Akola') {
        defaultElevation = this.feetToMeters(308);
      } else if (this.city === 'Chennai') {
        defaultElevation = this.feetToMeters(54);
      } else if (this.city === 'Delhi') {
        defaultElevation = this.feetToMeters(778);
      } else if (this.city === 'Guwahati') {
        defaultElevation = this.feetToMeters(163);
      } else if (this.city === 'Hyderabad') {
        defaultElevation = this.feetToMeters(542);
      } else if (this.city === 'Jaipur') {
        defaultElevation = this.feetToMeters(1268);
      } else if (this.city === 'Nagpur') {
        defaultElevation = this.feetToMeters(1033);
      } else if (this.city === 'Thiruvananthapuram') {
        defaultElevation = this.feetToMeters(17);
      } else if (this.city === 'Vadodara') {
        defaultElevation = this.feetToMeters(131);
      } else if (this.city === 'Varanasi') {
        defaultElevation = this.feetToMeters(270);
      } else if (this.city === 'Aurangabad') {
        defaultElevation = this.feetToMeters(1917);
      } else if (this.city === 'Bhopal') {
        defaultElevation = this.feetToMeters(1721);
      } else if (this.city === 'Bhavnagar') {
        defaultElevation = this.feetToMeters(43);
      } else if (this.city === 'Daman') {
        defaultElevation = this.feetToMeters(42);
      } else if (this.city === 'Gondia') {
        defaultElevation = this.feetToMeters(994);
      } else if (this.city === 'Rajkot INTL') {
        defaultElevation = this.feetToMeters(650);
      } else if (this.city === 'Indore') {
        defaultElevation = this.feetToMeters(1854);
      } else if (this.city === 'Jabalpur') {
        defaultElevation = this.feetToMeters(1626);
      } else if (this.city === 'Juhu') {
        defaultElevation = this.feetToMeters(17);
      } else if (this.city === 'Jalgaon') {
        defaultElevation = this.feetToMeters(842);
      } else if (this.city === 'Kondla') {
        defaultElevation = this.feetToMeters(97);
      } else if (this.city === 'Kolhapur') {
        defaultElevation = this.feetToMeters(2001);
      } else if (this.city === 'Keshod') {
        defaultElevation = this.feetToMeters(168);
      } else if (this.city === 'Mundra') {
        defaultElevation = this.feetToMeters(17);
      } else if (this.city === 'Ozar') {
        defaultElevation = this.feetToMeters(1995);
      } else if (this.city === 'Pune') {
        defaultElevation = this.feetToMeters(1943);
      } else if (this.city === 'Porbandar') {
        defaultElevation = this.feetToMeters(26);
      } else if (this.city === 'Shirdi') {
        defaultElevation = this.feetToMeters(1938);
      } else if (this.city === 'Surat') {
        defaultElevation = this.feetToMeters(25);
      } else if (this.city === 'Udaipur') {
        defaultElevation = this.feetToMeters(1690);
      } else if (this.city === 'Agartala') {
        defaultElevation = this.feetToMeters(56);
      } else if (this.city === 'Ayodhya') {
        defaultElevation = this.feetToMeters(329);
      } else if (this.city === 'Barapani') {
        defaultElevation = this.feetToMeters(2926);
      } else if (this.city === 'Bagdogra') {
        defaultElevation = this.feetToMeters(414);
      } else if (this.city === 'Bhubaneswar') {
        defaultElevation = this.feetToMeters(141);
      } else if (this.city === 'Bilaspur') {
        defaultElevation = this.feetToMeters(907);
      } else if (this.city === 'Kolkata') {
        defaultElevation = this.feetToMeters(20);
      } else if (this.city === 'Cooch-Behar') {
        defaultElevation = this.feetToMeters(141);
      } else if (this.city === 'Durgapur') {
        defaultElevation = this.feetToMeters(302);
      } else if (this.city === 'Gorakhpur') {
        defaultElevation = this.feetToMeters(260);
      } else if (this.city === 'Deoghar') {
        defaultElevation = this.feetToMeters(802);
      } else if (this.city === 'Gaya') {
        defaultElevation = this.feetToMeters(383);
      } else if (this.city === 'Hollongi') {
        defaultElevation = this.feetToMeters(351);
      } else if (this.city === 'Imphal') {
        defaultElevation = this.feetToMeters(2544);
      } else if (this.city === 'Jagdalpur') {
        defaultElevation = this.feetToMeters(1842);
      } else if (this.city === 'Jamshedpur') {
        defaultElevation = this.feetToMeters(481);
      } else if (this.city === 'Jharsuguda') {
        defaultElevation = this.feetToMeters(757);
      } else if (this.city === 'Jorhat') {
        defaultElevation = this.feetToMeters(299);
      } else if (this.city === 'Kushinagar') {
        defaultElevation = this.feetToMeters(263);
      } else if (this.city === 'Khajuraho') {
        defaultElevation = this.feetToMeters(731);
      } else if (this.city === 'Lengpui') {
        defaultElevation = this.feetToMeters(1406);
      } else if (this.city === 'Lilabari') {
        defaultElevation = this.feetToMeters(331);
      } else if (this.city === 'Dibrugarh') {
        defaultElevation = this.feetToMeters(360);
      } else if (this.city === 'Dimapur') {
        defaultElevation = this.feetToMeters(493);
      } else if (this.city === 'Patna') {
        defaultElevation = this.feetToMeters(175);
      } else if (this.city === 'Pakyong') {
        defaultElevation = this.feetToMeters(4646);
      } else if (this.city === 'Ranchi') {
        defaultElevation = this.feetToMeters(2150);
      } else if (this.city === 'Rourkela') {
        defaultElevation = this.feetToMeters(673);
      } else if (this.city === 'Raipur') {
        defaultElevation = this.feetToMeters(1044);
      } else if (this.city === 'Rupsi') {
        defaultElevation = this.feetToMeters(139);
      } else if (this.city === 'Tezu') {
        defaultElevation = this.feetToMeters(770);
      } else if (this.city === 'Agra') {
        defaultElevation = this.feetToMeters(550);
      } else if (this.city === 'Amritsar') {
        defaultElevation = this.feetToMeters(760);
      } else if (this.city === 'Kullu Manali') {
        defaultElevation = this.feetToMeters(3571);
      } else if (this.city === 'Bareilly') {
        defaultElevation = this.feetToMeters(571);
      } else if (this.city === 'Chandigarh') {
        defaultElevation = this.feetToMeters(1032);
      } else if (this.city === 'Safdarjung') {
        defaultElevation = this.feetToMeters(696);
      } else if (this.city === 'Dehradun') {
        defaultElevation = this.feetToMeters(1857);
      } else if (this.city === 'Hindan') {
        defaultElevation = this.feetToMeters(703);
      } else if (this.city === 'Kangra') {
        defaultElevation = this.feetToMeters(2527);
      } else if (this.city === 'Hisar') {
        defaultElevation = this.feetToMeters(701);
      } else if (this.city === 'Jodhpur') {
        defaultElevation = this.feetToMeters(712);
      } else if (this.city === 'Jammu') {
        defaultElevation = this.feetToMeters(956);
      } else if (this.city === 'Kishangarh') {
        defaultElevation = this.feetToMeters(1478);
      } else if (this.city === 'Ludhiana') {
        defaultElevation = this.feetToMeters(834);
      } else if (this.city === 'Leh') {
        defaultElevation = this.feetToMeters(10839);
      } else if (this.city === 'Lucknow') {
        defaultElevation = this.feetToMeters(406);
      } else if (this.city === 'Pithoragarh') {
        defaultElevation = this.feetToMeters(5050);
      } else if (this.city === 'Pantnagar') {
        defaultElevation = this.feetToMeters(764);
      } else if (this.city === 'Shimla') {
        defaultElevation = this.feetToMeters(5065);
      } else if (this.city === 'Srinagar') {
        defaultElevation = this.feetToMeters(5451);
      } else if (this.city === 'Uttarlai') {
        defaultElevation = this.feetToMeters(500);
      } else if (this.city === 'Agatti') {
        defaultElevation = this.feetToMeters(14);
      } else if (this.city === 'Bengaluru HAL') {
        defaultElevation = this.feetToMeters(2914);
      } else if (this.city === 'Bengaluru KIA') {
        defaultElevation = this.feetToMeters(2907);
      } else if (this.city === 'Belagavi') {
        defaultElevation = this.feetToMeters(2499);
      } else if (this.city === 'Bidar') {
        defaultElevation = this.feetToMeters(2100);
      } else if (this.city === 'Vijaywada') {
        defaultElevation = this.feetToMeters(82);
      } else if (this.city === 'Cochin') {
        defaultElevation = this.feetToMeters(9);
      } else if (this.city === 'Calicut') {
        defaultElevation = this.feetToMeters(342);
      } else if (this.city === 'Kadapa') {
        defaultElevation = this.feetToMeters(430);
      } else if (this.city === 'Mopa') {
        defaultElevation = this.feetToMeters(243);
      } else if (this.city === 'Kalaburagi') {
        defaultElevation = this.feetToMeters(1521);
      } else if (this.city === 'Goa') {
        defaultElevation = this.feetToMeters(187);
      } else if (this.city === 'Hubballi') {
        defaultElevation = this.feetToMeters(2171);
      } else if (this.city === 'Shamshabad RGI') {
        defaultElevation = this.feetToMeters(2021);
      } else if (this.city === 'Begumpet') {
        defaultElevation = this.feetToMeters(1740);
      } else if (this.city === 'Jindal Vijayanagar') {
        defaultElevation = this.feetToMeters(1910);
      } else if (this.city === 'Kannur') {
        defaultElevation = this.feetToMeters(256);
      } else if (this.city === 'Kurnool') {
        defaultElevation = this.feetToMeters(906);
      } else if (this.city === 'Madurai') {
        defaultElevation = this.feetToMeters(459);
      } else if (this.city === 'Mangaluru') {
        defaultElevation = this.feetToMeters(338);
      } else if (this.city === 'Mysuru') {
        defaultElevation = this.feetToMeters(2398);
      } else if (this.city === 'Portblair') {
        defaultElevation = this.feetToMeters(13);
      } else if (this.city === 'Puducherry') {
        defaultElevation = this.feetToMeters(118);
      } else if (this.city === 'Puttaparthi') {
        defaultElevation = this.feetToMeters(1248);
      } else if (this.city === 'Rajahmundry') {
        defaultElevation = this.feetToMeters(151);
      } else if (this.city === 'Salem') {
        defaultElevation = this.feetToMeters(1033);
      } else if (this.city === 'Shivamogga') {
        defaultElevation = this.feetToMeters(1841);
      } else if (this.city === 'Sindhudurg') {
        defaultElevation = this.feetToMeters(198);
      } else if (this.city === 'Tuticorin') {
        defaultElevation = this.feetToMeters(14);
      } else if (this.city === 'Tirupati') {
        defaultElevation = this.feetToMeters(355);
      } else if (this.city === 'Tiruchirappalli') {
        defaultElevation = this.feetToMeters(288);
      } else if (this.city === 'Visakhapatnam') {
        defaultElevation = this.feetToMeters(15);
      } else if (this.city === 'Jeypore') {
        defaultElevation = this.feetToMeters(660);
      } else if (this.city === 'Bhawanipatna') {
        defaultElevation = this.feetToMeters(661);
      } else if (this.city === 'Utkela') {
        defaultElevation = this.feetToMeters(686);
      }
      this.TopElevationForm.patchValue({ Site_Elevation: defaultElevation });
      alert("Users shall enter site elevation value received from WGS-84 survey report. Permissible height will be calculated based on site elevation entered by user. In absense of site elevation value from user, ARP (Airport) elevation value will be used as default.")

    }
    else {
      this.showAlert = false;
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
              alert("Session Expired.Please Login..");
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
    const selectionMode = this.TopElevationForm.get('selectionMode')?.value;
    if (selectionMode === 'manual') {

      if (airport) {
        this.TopElevationForm.patchValue({
          CITY: airportCity,
        });
        this.selectedAirportName = airportName;
        this['selectedAirportCoordinates'] = [airport[0], airport[1]];
      }
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


  showDefaultMap() {
    const defaultLat = 0.0;
    const defaultLong = 0.0;
    this.lat = defaultLat;
    this.long = defaultLong;
    this.showMap(this.lat, this.long);
  }

  showMap(lat: number, lng: number) {
    this.map = L.map('map').setView([19.794444, 85.751111], 5);

    // Add your base maps and layers here
    const streets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(this.map);

    // Add the rest of the base maps and layers
    const baseMaps = {
      'Streets': streets,
      'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {}),
      'Navigation': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16
      }),
      'Hybrid': L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }),
      'Satellite google': L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }),
      'Terrain': L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }),
      'Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {})
    };

    L.control.layers(baseMaps).addTo(this.map);
    L.control.scale().addTo(this.map);

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    }
    if (this.nearestAirportGeoJSONLayer) {
      this.map.removeLayer(this.nearestAirportGeoJSONLayer);
      this.nearestAirportGeoJSONLayer = null;
    }
    if (this.geojsonLayer) {
      this.map.removeLayer(this.geojsonLayer);
      this.geojsonLayer.clearLayers();
      this.geojsonLayer = null;
    }
    if (this.marker2) {
      this.map.removeLayer(this.marker2);
      this.marker2 = null;
    }
    if (this.nearestAirportGeoJSONLayer) {
      this.map.removeLayer(this.nearestAirportGeoJSONLayer);
      this.nearestAirportGeoJSONLayer = null;
    }


    // this.marker.on('dragend', (e: any) => {
    //   const position = this.marker.getLatLng();
    //   this.lat = position.lat;
    //   this.long = position.lng;
    //   this.latitudeDMS = this.convertDDtoDMS(position.lat, true);
    //   this.longitudeDMS = this.convertDDtoDMS(position.lng, false);

    //   const selectionMode = this.TopElevationForm.get('selectionMode')?.value;
    //   if (selectionMode === 'manual') {
    //     const manualCity = this.TopElevationForm.get('CITY')?.value;
    //     const cityLocation = this.getCityLocation(manualCity);
    //     if (cityLocation) {
    //       const distance = this.calculateDistance(position.lat, position.lng, cityLocation.lat, cityLocation.lng);
    //       this.TopElevationForm.patchValue({
    //         CITY: manualCity,
    //         AIRPORT_NAME: `Nearest city: ${manualCity} (${distance.toFixed(2)} km away)`
    //       });
    //     }
    //   } else {
    //     const nearestAirport = this.findNearestAirport(position.lat, position.lng, 30); // 30 km
    //     if (nearestAirport) {
    //       this.TopElevationForm.patchValue({
    //         CITY: nearestAirport.airportCity,
    //         AIRPORT_NAME: nearestAirport.airportName

    //       });
    //     } else {
    //       alert('No airport found within 30 km.');
    //       if (this.nearestAirportGeoJSONLayer) {
    //         this.map.removeLayer(this.nearestAirportGeoJSONLayer);
    //         this.nearestAirportGeoJSONLayer = null;
    //       }
    //       if (this.geojsonLayer) {
    //         this.map.removeLayer(this.geojsonLayer);
    //         this.geojsonLayer.clearLayers();
    //         this.geojsonLayer = null;
    //       }
    //       if (this.marker2) {
    //         this.map.removeLayer(this.marker2);
    //         this.marker2 = null;
    //       }
    //       if (this.nearestAirportGeoJSONLayer) {
    //         this.map.removeLayer(this.nearestAirportGeoJSONLayer);
    //         this.nearestAirportGeoJSONLayer = null;
    //       }
    //       this.map.eachLayer((layer: any) => {
    //         if (layer instanceof L.GeoJSON) {
    //           this.map.removeLayer(layer);
    //         }
    //       });

    //     }
    //   }

    //   this.TopElevationForm.patchValue({
    //     Latitude: this.latitudeDMS,
    //     Longitude: this.longitudeDMS
    //   });

    //   const popupContent = `Site Location : <br> Site Latitude: ${this.latitudeDMS}, Site Longitude: ${this.longitudeDMS}`;
    //   this.marker.bindPopup(popupContent).openPopup();
    // });
  }

  getCityLocation(cityName: string): { lat: number, lng: number } | null {
    return null;
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


}


