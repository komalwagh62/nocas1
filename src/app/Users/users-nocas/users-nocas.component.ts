import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as L from 'leaflet';
import { ApiService } from '../Shared/Api/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-nocas',
  templateUrl: './users-nocas.component.html',
  styleUrl: './users-nocas.component.scss'
})
export class UsersNOCASComponent implements OnInit {
  // latitude: any;
  // longitude: any;
  line: any;
  popupContent: any;
  lat: number = 0.0;
  long: number = 0.0;
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
  isAuthenticated: boolean = false;

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

      elevationOption: ['unknown']

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
      // Set default value for Site_Elevation based on selected city
      let defaultElevation = null;
      if (city === 'Coimbatore') {
        defaultElevation = 10;
      } else if (city === 'Mumbai') {
        defaultElevation = 22;
      } else if (city === 'Puri') {
        defaultElevation = 22;
      }
      this.TopElevationForm.patchValue({ Site_Elevation: defaultElevation });
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
        const popupContent = `Your location : <br> Latitude: ${lat.toFixed(2)}, Longitude: ${lng.toFixed(2)}`;

        // Bind the popup content to the marker
        this.marker.bindPopup(popupContent).openPopup();
      }
    });
  }


  submitForm() {
    // Check if the token exists
    if (!this.apiservice.token) {
      alert('Please log in first.');
      // Redirect the user to the login page or take appropriate action
      this.router.navigate(['UsersLogin']);
      return; // Exit the function if the token does not exist
    }
  
    
    if (!this.TopElevationForm.valid) {
      return; // Exit if the form is not valid
    }
  
    const confirmation = confirm("Kindly confirm that the entered site information is correct or verify");
  
    if (!confirmation) {
      console.log('Form submission cancelled');
      return; // Exit if the user cancels the confirmation
    }
  
    fetch('http://localhost:3001/api/subscription/checkSubscriptions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiservice.token}`
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        console.error('User is not subscribed.');
        // Handle user not subscribed
        alert('You have not subscribed to any package. For more information, please click OK.');
        this.router.navigate(['PricingPlans']);
        return null; // Ensure a value is returned
      }
    })
    .then(data => {
      if (data && data.isSubscribed) {
        // User is subscribed, proceed with form submission
        alert('User is subscribed. Proceeding with form submission...');
        console.log('Form submitted successfully');
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
          this.displayMapData(latitude, longitude, this.airportCoordinates);
          this.showMap(latitude, longitude);
        }
      } 
    })

  }
  
  
    getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Location successfully retrieved
            this.lat = position.coords.latitude;
            this.long = position.coords.longitude;

            // Update the markers and line with the new location
            this.updateMarkerPosition();
            this.updatePolyline(this.lat, this.long);

            // Now that you have the location, you can display the popup
            const popupContent = `Your location : <br>  Latitude: ${this.lat.toFixed(2)}, Longitude: ${this.long.toFixed(2)}`;

            // Add the marker to the map before setting the popup content
            this.marker.addTo(this.map).bindPopup(popupContent).openPopup();

            // Update the displayed map data
            this.displayMapData(this.lat, this.long, this.airportCoordinates);
            this.showMap(this.lat, this.long);
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
      this.map = L.map('map', { zoomControl: false, attributionControl: false }).setView([20.5937, 78.9629], 4);

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

      const popupContent = `Your location : <br>  Latitude: ${lat.toFixed(2)}, Longitude: ${lng.toFixed(2)}`;
      this.marker = L.marker([lat, lng]).bindPopup(popupContent).addTo(this.map);
      // this.marker.addTo(this.map).bindPopup(popupContent).openPopup();
      // this.line = L.polyline([[lat, lng], [lat, lng]], { color: 'black' }).addTo(this.map);

    }


    showModal(): void {
      // Code to show the modal
      const modal = document.getElementById('exampleModal');
      if(modal) {
        modal.classList.add('show');
        modal.style.display = 'block';
      }
    }
    closeModal(): void {
      const modal = document.getElementById('exampleModal');
      if(modal) {
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
                const popupContent = `Your location : <br> Latitude: ${lat.toFixed(2)}, Longitude: ${lng.toFixed(2)}`;

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

      // Remove the current location marker if it exists
      if (this.marker) {
        this.map.removeLayer(this.marker);
        this.marker = null; // Reset the current location marker
      }

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
      this.TopElevationForm.reset();
    }

    displayMapData(lat: number, lng: number, airportCoordinates: [number, number]) {
      const newDistance = this.calculateDistance(lat, lng, airportCoordinates[0], airportCoordinates[1]);
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
          const elevation = (properties.Name);
          const permissibleHeight = parseFloat(properties.Name) - siteElevation;
          mapData.innerHTML = `
        <table class="table table-hover">
  <tbody>
  <tr>
      <th scope="row"> Permissible Elevation<br>
      (AMSL Above Mean Sea Level)</th>
      <td>${elevation}M</td>
      
    </tr>
    <tr>
      <th scope="row"> Permissible Height<br>
      (AGL- Above ground level)
      </th>
      <td> ${permissibleHeight < 0 ? '-' : ''}${Math.abs(permissibleHeight).toFixed(2)}M</td>
     
    </tr>
    <tr>
      <th scope="row">Site Location </th>
      <td colspan="2" >Latitude: ${lat.toFixed(2)} N <br> Longitude: ${lng.toFixed(2)} E</td>
     
    </tr>
    <tr>
      <th scope="row">Distance<br>
      (Site Location from ARP)</th>
      <td colspan="2"> ${newDistance.toFixed(2)} km</td>
     
    </tr>
  </tbody>
</table> `;
        } else {
          mapData.innerHTML = `
          <div>
         <b>Site location selected by User is outside CCZM boundary published by AAI. Permissible Elevation calculation could not be processed. Please contact us for further details</b><br> <br>
          
         <table class="table table-hover">
         <tbody>
           <tr>
             <th scope="row">Site Location</th>
             <td colspan="2" >Latitude: ${lat.toFixed(2)} N <br> Longitude: ${lng.toFixed(2)} E</td>
           </tr>
           <tr>
             <th scope="row">Distance<br>
             (Site Location from ARP)</th>
             <td colspan="2">${newDistance.toFixed(2)} km</td>
           </tr>
         </tbody>
       </table> 
          </div> <br>`;
        }
        mapData.style.display = 'block';
      }
    }

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
