import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  map!: Map;
  vectorLayer!: any; // Use any type here
  heatmapLayer!: any; // Use any type here

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initMap();
    this.loadGeoJSONData();
  }

  initMap(): void {
    // Map initialization is handled in the HTML directly
  }

  loadGeoJSONData(): void {
    // Data loading and handling is handled in the HTML directly
  }
}
