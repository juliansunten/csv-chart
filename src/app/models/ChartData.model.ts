export class CSVRecord {
    public Abnormal: any;
    public Normal: any;
    public value: any;
    public timestamp: any;

    constructor(Abnormal, Normal, value, timestamp){
        this.Abnormal = Abnormal;
        this.Normal = Normal;
        this.value = value;
        this.timestamp = timestamp;
    }
}
