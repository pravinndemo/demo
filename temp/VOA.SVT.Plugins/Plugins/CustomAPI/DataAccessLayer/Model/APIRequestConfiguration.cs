namespace VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model
{
    public sealed class APIRequestConfiguration
    {
        public string Address { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string Scope { get; set; }
        public string APIMSubscriptionKey { get; set; }
        public string TenantId { get; set; }
    }
}
