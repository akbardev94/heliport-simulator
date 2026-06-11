// Reference helicopter database (typical published dimensions).
// D = Rotor Diameter (m), OL = Overall Length (m),
// UCW = Undercarriage Width (m), MTOM = Maximum Take-Off Mass (kg)
export const HELICOPTERS = [
  { id: "aw139", name: "AW 139", D: 13.8, OL: 16.66, UCW: 2.3, MTOM: 6400 },
  { id: "aw169", name: "AW 169", D: 12.12, OL: 14.65, UCW: 2.0, MTOM: 4800 },
  { id: "aw189", name: "AW 189", D: 14.6, OL: 17.6, UCW: 2.6, MTOM: 8600 },
  { id: "ec135", name: "Airbus H135 (EC135)", D: 10.2, OL: 12.16, UCW: 2.0, MTOM: 2980 },
  { id: "h145", name: "Airbus H145 (EC145)", D: 11.0, OL: 13.64, UCW: 2.05, MTOM: 3800 },
  { id: "h160", name: "Airbus H160", D: 12.99, OL: 15.07, UCW: 2.3, MTOM: 6050 },
  { id: "h175", name: "Airbus H175", D: 14.8, OL: 17.74, UCW: 2.6, MTOM: 7800 },
  { id: "bell412", name: "Bell 412", D: 14.02, OL: 17.1, UCW: 2.86, MTOM: 5398 },
  { id: "bell429", name: "Bell 429", D: 11.0, OL: 13.11, UCW: 2.4, MTOM: 3175 },
  { id: "s76", name: "Sikorsky S-76", D: 13.41, OL: 16.0, UCW: 2.44, MTOM: 5307 },
  { id: "s92", name: "Sikorsky S-92", D: 17.17, OL: 20.88, UCW: 3.6, MTOM: 12837 },
  { id: "bk117", name: "Kawasaki BK117", D: 11.0, OL: 13.0, UCW: 2.5, MTOM: 3350 },
  { id: "custom", name: "Custom (input manual)", D: 0, OL: 0, UCW: 0, MTOM: 0 },
];

export const WIND_DIRECTIONS = [
  { value: 0, label: "0° (Utara)" },
  { value: 45, label: "45° (Timur Laut)" },
  { value: 90, label: "90° (Timur)" },
  { value: 135, label: "135° (Tenggara)" },
  { value: 180, label: "180° (Selatan)" },
  { value: 225, label: "225° (Barat Daya)" },
  { value: 270, label: "270° (Barat)" },
  { value: 315, label: "315° (Barat Laut)" },
];
