import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import * as Highcharts from 'highcharts';
import {HttpClient} from '@angular/common/http';
import {interval, Subscription} from 'rxjs';
import {environment} from '../../environments/environment.prod';

declare var require: any;
let Boost = require('highcharts/modules/boost');
let noData = require('highcharts/modules/no-data-to-display');
let More = require('highcharts/highcharts-more');

Boost(Highcharts);
noData(Highcharts);
More(Highcharts);
noData(Highcharts);

@Component({
  selector: 'app-output-graph',
  templateUrl: './output-graph.component.html',
  styleUrls: ['./output-graph.component.css']
})

export class OutputGraphComponent implements OnDestroy {
  // CONFIGURATION
  apiLink = 'https://www.datenportal.bmbf.de/portal/Tabelle-1.6.2.csv';
  headSeparator = ','; // Output Konfiguration
  separator = ';'; // Output Konfiguration
  csvMode = true; // Output Mode Automatik oder CSV UPLOAD
  chartLabels = ['FUE-Ausgaben', 'Drittmittel', 'Drittes Label'];
  speed = 4; // refreshing Speed in Seconds
  // CONFIGURATION END

  headersRow: string[] = [];
  public records: any[] = [];
  subscription: Subscription;
  @ViewChild('csvReader') csvReader: any;

  public options: any = {
    chart: {
      type: 'scatter',
      height: 700
    },
    title: {
      text: 'Sample Scatter Plot'
    },
    credits: {
      enabled: false
    },
    series: [
      {
        name: '',
        data: []
      },
      {
        name: '',
        data: []
      },
      {
        name: '',
        data: []
      },
    ]
  };
  constructor(private http: HttpClient) {
    // Set 2 seconds interval to update data again and again
    const source = interval(this.speed * 1000);
    if (this.csvMode === false) {
      this.subscription = source.subscribe(() =>
          this.getApiResponse(this.apiLink)
              .then(
                  data => {
                    // if false APP runs in Json Mode
                    const updated_normal_data = [];
                    const updated_abnormal_data = [];
                    data.forEach(row => {
                      const temp_row = [new Date(row.timestamp).getTime(), row.value];
                      row.Normal === 1 ? updated_normal_data.push(temp_row) : updated_abnormal_data.push(temp_row);
                    });
                    this.options.series[0]['data'] = updated_normal_data;
                    console.log(this.options);
                    Highcharts.chart('container', this.options);
                  })
              .catch(err => {
                console.log(err);
              })
      );
    } else {
      const sourceCSV = interval(this.speed *1000);
      sourceCSV.subscribe( () => {
        this.getCSV().subscribe((data: any) => {
          this.uploadListener(data.body);
        });
      });
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  parseCsvFile(csvRecordsArray: any) {
    const chart0 = [];
    const chart1 = [];
    const chart2 = [];

    for (let i = 1; i < csvRecordsArray.length; i++) {
      const currentRecord = (csvRecordsArray[i]).split(this.separator);

      /*Parsing Data Rows to Chart Plotter*/
      const rowData0 = [parseInt(currentRecord[0], 10), parseInt(currentRecord[1], 10)];
      const rowData1 = [parseInt(currentRecord[0], 10), parseInt(currentRecord[2], 10)];
      const rowData2 = [parseInt(currentRecord[0], 10), parseInt(currentRecord[3], 10)];

      chart0.push(rowData0);
      chart1.push(rowData1);
      chart2.push(rowData2);
    }

    this.options.series[0]['data'] = chart0;
    this.options.series[1]['data'] = chart1;
    this.options.series[2]['data'] = chart2;
    if (this.chartLabels.length > 0) {
      this.options.series[0].name = this.chartLabels[0];
      this.options.series[1].name = this.chartLabels[1];
      this.options.series[2].name = this.chartLabels[2];
    }
    return Highcharts.chart('container', this.options);
  }

  getCSV() {
    return this.http.post(environment.csvCloudFunction,
        {apiLink: this.apiLink}
    );
  }
  // An Algorithm to Clean up The CSV
  cleanArray(csvArray) {
    if (csvArray.includes(';;')) {
      csvArray.forEach( (entry, index) => {
        if (entry.includes(';;')) {
          csvArray.splice(index, 1);
        }
      });
      return this.cleanArray(csvArray);
    } else {
      return csvArray;
    }
  }

  uploadListener(data) {
    const csvRecordsArray = (<string>data).split(/\r\n|\n/);
    const cleanArray = this.cleanArray(csvRecordsArray);
    this.headersRow = this.getHeaderArray(cleanArray);
    this.parseCsvFile(cleanArray);
  }

  getHeaderArray(csvRecordsArr: any) {
    const headers = (<string>csvRecordsArr[0]).split(this.headSeparator);
    const headerArray = [];
    for (let j = 0; j < headers.length; j++) {
      headers[j] = headers[j].replace(';', '');
      headers[j] = headers[j].replace(';', '');
      headerArray.push(headers[j]);
    }
    return headerArray;
  }

  getApiResponse(url) {
    return this.http.get<any>(url, {})
        .toPromise().then(res => {
          return res;
        });
  }
}

