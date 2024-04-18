import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-users-nocas',
  templateUrl: './users-nocas.component.html',
  styleUrl: './users-nocas.component.scss'
})
export class UsersNOCASComponent implements OnInit {
  latitude: any;
  longitude: any;
  line: any;
  popupContent: any;
  lat!: any;
  long!: any;
  updatedDistance!: number;
  TopElevationForm!: FormGroup | any;
  marker: any;
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

  constructor(private formbuilder: FormBuilder, private http: HttpClient) { }

  ngOnInit(): void {
    this.TopElevationForm = this.formbuilder.group({
      Latitude: ['', [Validators.required, Validators.nullValidator,]],
      Longitude: ['', [Validators.required, Validators.nullValidator,]],
      CITY: ['', [Validators.required, Validators.nullValidator,]],
      // airportName: ['', [Validators.required, Validators.nullValidator,]],
      // airportIcao: ['', [Validators.required, Validators.nullValidator,]],
      // airportIata: ['', [Validators.required, Validators.nullValidator,]],
      Site_Elevation: new FormControl('', [Validators.required, Validators.nullValidator, Validators.pattern(/^[0-5]+(?:\.[0-5]+)?$/)]),
    });

    this.TopElevationForm.get('Latitude').valueChanges.subscribe((lat: number) => {
      console.log('Latitude changed:', lat);
      this.updateMarker2Position(lat, this.TopElevationForm.get('Longitude').value);
      this.updatePolyline(lat, this.TopElevationForm.get('Longitude').value);
      this.displayMapData(lat, this.TopElevationForm.get('Longitude').value, this.marker.getLatLng());
    });

    this.TopElevationForm.get('Longitude').valueChanges.subscribe((lng: number) => {
      console.log('Longitude changed:', lng);
      this.updateMarker2Position(this.TopElevationForm.get('Latitude').value, lng);
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

    this.getLocation();
    this.fetchAirports();
  }

  submitForm() {
    if (this.TopElevationForm.valid) {
      const airportCITY = this.TopElevationForm.get('CITY')?.value;
      const latitude = parseFloat(this.TopElevationForm.get('Latitude')?.value);
      const longitude = parseFloat(this.TopElevationForm.get('Longitude')?.value);

      if (airportCITY && !isNaN(latitude) && !isNaN(longitude)) {
        // Update the markers and line
        console.log('Latitude:', latitude);
        console.log('Longitude:', longitude);
        this.updateMarker2Position(latitude, longitude);
        this.updatePolyline(latitude, longitude);
        // Update the displayed map data
        this.displayMapData(latitude, longitude, this.airportCoordinates);
        this.showMap(latitude, longitude);
        
      } else {
        console.error("Please fill in valid airport ICAO code, latitude, and longitude.");
      }
    } else {
      console.error("Form is invalid");
    }
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.lat = position.coords.latitude;
        this.long = position.coords.longitude;
        this.showMap(this.lat, this.long);
      });
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
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
    // Add scale Control
    L.control.scale().addTo(this.map);
    // Add Zoom Control
    L.control.zoom().addTo(this.map);

    this.line = L.polyline([[lat, lng], [lat, lng]], { color: 'blue' }).addTo(this.map);

    this.marker = L.marker([lat, lng]).addTo(this.map);
  }

  loadGeoJSON(map: any) {
    if (!map) {
      console.error("Map object is required to load GeoJSON.");
      return;
    }

    // Remove the existing GeoJSON layer if it exists
    if (this.geojsonLayer) {
      map.removeLayer(this.geojsonLayer);
      this.geojsonLayer = null; // Reset the GeoJSON layer
    }

    // Remove the existing marker2 if it exists
    if (this.marker2) {
      map.removeLayer(this.marker2);
      this.marker2 = null; // Reset the airport marker
    }

    // Remove the existing marker and line if they exist
    if (this.marker) {
      map.removeLayer(this.marker);
      this.marker = null; // Reset the current location marker
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
        this.airportCoordinates = [11.0300, 77.0434]; // Coordinates of VOCB
      } else if (selectedAirportCITY === 'Mumbai') {
        airportGeoJSONPath = 'assets/Mumbai.geojson';
        this.airportCoordinates = [19.0887, 72.8679]; // Coordinates of VABB
      } else if (selectedAirportCITY === 'Puri') {
        airportGeoJSONPath = 'assets/Puri.geojson';
        this.airportCoordinates = [19.79825, 85.82494]; // Coordinates of VEJH
      } else {
        console.error("Invalid airport ICAO code.");
        return;
      }

      // Fetch the corresponding GeoJSON file
      fetch(airportGeoJSONPath)
        .then(response => response.json())
        .then(geojsonData => {
          const geojsonLayer = L.geoJSON(geojsonData);
          geojsonLayer.addTo(map);
          this.geojsonLayer = geojsonLayer;

          // Draw a marker for the selected airport
          this.marker2 = L.marker(this.airportCoordinates).addTo(map);

          // Draw a line from the selected airport to the current location
          if (this.lat && this.long) {
            this.marker = L.marker([this.lat, this.long]).addTo(map);
            this.line = L.polyline([this.airportCoordinates, [this.lat, this.long]], { color: 'blue' }).addTo(map);
          }

          // Fit the map bounds to the GeoJSON layer and the markers
          const bounds = L.latLngBounds([this.airportCoordinates, [this.lat, this.long]]);
          map.fitBounds(bounds);

          // Event listener for the click event on the map
          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;

            // Update latitude and longitude form fields
            this.TopElevationForm.patchValue({
              Latitude: lat.toFixed(2),
              Longitude: lng.toFixed(2)
            });

            // Update the marker position
            if (this.marker) {
              this.marker.setLatLng([lat, lng]);
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
                // Display map data
                // this.displayMapData(lat, lng, this.airportCoordinates);
              }
            }
          });

          // Display map data for the selected airport
          // this.displayMapData(this.lat, this.long, this.airportCoordinates);
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
    // Calculate the distance
    const newDistance = this.calculateDistance(lat, lng, airportCoordinates[0], airportCoordinates[1]);
    console.log(newDistance, airportCoordinates)

    // Check if the clicked point is inside the GeoJSON data
    const clickedFeature = this.geojsonLayer.getLayers().find((layer: any) => {
      return layer.getBounds().contains([lat, lng]);
    });

    console.log('Clicked Feature:', clickedFeature);

    // Display latitude, longitude, and distance
    const mapData = document.getElementById('mapData');
    if (mapData !== null) {
      // Clear existing content and hide the container
      mapData.innerHTML = '';
      mapData.style.display = 'none';

      // Retrieve site elevation value
      const siteElevationInput = this.TopElevationForm.get('Site_Elevation');
      const siteElevation = siteElevationInput ? siteElevationInput.value : 0;

      if (clickedFeature) {
        // Extract properties of the clicked feature
        const properties = clickedFeature.feature.properties;
        const elevation = (properties.Name);

        // Calculate permissible height
        const permissibleHeight = parseFloat(properties.Name) - siteElevation;
        // console.log(permissibleHeight)

        // Update HTML content
        mapData.innerHTML = `
          <div>
            Permissible Elevation: ${elevation}<br>
            Permissible Height: ${permissibleHeight < 0 ? '-' : ''}${Math.abs(permissibleHeight).toFixed(3)}M <br>
            Latitude: ${lat.toFixed(2)}, Longitude: ${lng.toFixed(2)}<br>
            Distance: ${newDistance.toFixed(2)} km
          </div>`;
      } else {
        // Update HTML content for non-feature clicks
        mapData.innerHTML = `
          <div>
            Latitude: ${lat.toFixed(2)}, Longitude: ${lng.toFixed(2)}<br>
            Distance: ${newDistance.toFixed(2)} km
          </div>`;
      }

      // Make map data visible
      mapData.style.display = 'block';

    }
  }

  updatePolyline(lat: number, lng: number) {
    if (this.line) {
      // Update the line's coordinates using the updated marker's position
      this.line.setLatLngs([[lat, lng], [this.marker2.getLatLng().lat, this.marker2.getLatLng().lng]]);
    }
  }

  updateMarker2Position(lat: number, lng: number) {
    if (this.marker) {
      // Update the position of the second marker
      this.marker.setLatLng([lat, lng]);
    }
  }

  fetchAirports() {
    this.http.get<any>('https://myprofile-ae1fc-default-rtdb.firebaseio.com/airportsData =.json')
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
