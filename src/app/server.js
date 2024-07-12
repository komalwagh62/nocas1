const express = require('express');
const { Pool } = require('pg');
const app = express();
const cors = require('cors');
const wkx = require('wkx');
const port = 3005;

app.use(cors()); // Enable CORS for all routes

const pool = new Pool({
  user: 'postgres',
  host: 'mydb.cxeos2wmmsqf.us-east-2.rds.amazonaws.com',
  database: 'supplement',
  password: 'postgres',
  port: 5432,
});

app.get('/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM convlinedata');
    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map(row => ({
        type: "Feature",
        geometry: wkx.Geometry.parse(Buffer.from(row.geomcolumn, 'hex')).toGeoJSON(),
        properties: {
          airway_id: row.airway_id,
          track_magnetic: row.track_magnetic,
          reverse_magnetic: row.reverse_magnetic,
          radial_distance: row.radial_distance,
          upper_limit: row.upper_limit,
          lower_limit: row.lower_limit,
          airspace: row.airspace,
          mea: row.mea,
          lateral_limits: row.lateral_limits,
          direction_of_cruising_levels: row.direction_of_cruising_levels,
          type: row.type,
          remarks: row.remarks
        }
      }))
    };
    res.json(geojson);
  } catch (err) {
    console.error('Error executing query or processing data:', err);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
