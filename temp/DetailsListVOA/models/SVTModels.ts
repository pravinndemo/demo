export class SDLTRecord {
  public SDLTID!: string;
  public TransactionPrice!: string;
  public TransactionPremium!: string;
  public TransactionDate!: string;
  public GroundRent!: string;
  public Vendors!: string[];
  public Vendees!: string[];
  public VendorAgents!: string[];
  public VendeeAgents!: string[];
  public TypeofProperty!: string;
  public TenureType!: string;
  public LeaseFrom!: string;
  public LeaseTerm!: string;
  public IsMasterSaleRecord!: boolean;
}

export class SVTSaleRecord {
  public uprn!: string;
  public task_ID!: string;
  public postcode!: string;
  public address!: string;
  public billingAuthority!: string;
  public band!: string;
  public salePrice!: string;
  public transactionDate!: string;
  public latestModelPrice!: string;
  public latestAdjustedPrice!: string;
  public overallFlag!: string;
  public ratio!: string;
  public outlier!: boolean;
  public flags!: string[];
  public usefulSale!: string;
  public notes!: string;
  public kitchenAge!: string;
  public kitchenSpec!: string;
  public bathroomAge!: string;
  public bathroomSpec!: string;
  public decorativeFinishes!: string;
  public conditionScore!: number;
  public conditionCategory!: string;
  public propertyType!: string;
  public LRPPDID!: string;
  public SDLT!: SDLTRecord[];
}
