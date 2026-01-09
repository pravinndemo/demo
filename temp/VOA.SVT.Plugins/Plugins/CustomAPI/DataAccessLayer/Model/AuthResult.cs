namespace VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model
{
    public sealed class AuthResult
    {
        public string AccessToken { get; set; }
        public string TokenType { get; set; }
        public int ExpiresIn { get; set; }
    }
}
