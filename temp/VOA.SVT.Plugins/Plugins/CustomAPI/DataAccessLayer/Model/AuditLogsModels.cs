using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace VOA.SVT.Plugins.CustomAPI.DataAccessLayer.Model
{
    public sealed class AuditLogsPayload
    {
        [JsonPropertyName("taskId")]
        public string TaskId { get; set; }

        [JsonPropertyName("auditHistory")]
        public List<AuditHistoryRecord> AuditHistory { get; set; }

        [JsonPropertyName("errorMessage")]
        public string ErrorMessage { get; set; }

        [JsonExtensionData]
        public Dictionary<string, JsonElement> ExtensionData { get; set; }
    }

    public sealed class AuditHistoryRecord
    {
        [JsonPropertyName("changeID")]
        public int? ChangeId { get; set; }

        [JsonPropertyName("changedBy")]
        public string ChangedBy { get; set; }

        [JsonPropertyName("eventType")]
        public string EventType { get; set; }

        [JsonPropertyName("changedOn")]
        public string ChangedOn { get; set; }

        [JsonPropertyName("changes")]
        public List<AuditFieldChange> Changes { get; set; }

        [JsonExtensionData]
        public Dictionary<string, JsonElement> ExtensionData { get; set; }
    }

    public sealed class AuditFieldChange
    {
        [JsonPropertyName("fieldName")]
        public string FieldName { get; set; }

        [JsonPropertyName("oldValue")]
        public JsonElement OldValue { get; set; }

        [JsonPropertyName("newValue")]
        public JsonElement NewValue { get; set; }

        [JsonExtensionData]
        public Dictionary<string, JsonElement> ExtensionData { get; set; }
    }
}
