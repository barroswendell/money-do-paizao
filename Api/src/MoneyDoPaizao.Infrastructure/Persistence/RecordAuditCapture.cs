using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Infrastructure.Persistence;

internal static class RecordAuditCapture
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public static IReadOnlyList<RecordAudit> Capture(ChangeTracker tracker, AuditActor? actor)
    {
        var entries = tracker.Entries().ToArray();
        if (entries.Any(entry => entry.State == EntityState.Deleted && entry.Entity is IManagedRecord or PartyEventProduct))
            throw new InvalidOperationException("Registros operacionais devem ser desativados.");

        if (actor is null) return [];

        var now = DateTime.UtcNow;
        var result = new List<RecordAudit>();
        var references = entries.Where(entry => entry.Entity is Customer or Product or PartyTheme)
            .Select(entry => (IManagedRecord)entry.Entity)
            .ToDictionary(item => item.Id, NameOf);
        var parties = entries.Select(entry => entry.Entity).OfType<PartyEvent>().ToDictionary(item => item.Id);
        var sales = entries.Select(entry => entry.Entity).OfType<Sale>().ToDictionary(item => item.Id);
        var loans = entries.Select(entry => entry.Entity).OfType<Loan>().ToDictionary(item => item.Id);

        foreach (var entry in entries.Where(entry => entry.State is EntityState.Added or EntityState.Modified))
        {
            switch (entry.Entity)
            {
                case IManagedRecord record when KindOf(record) is { } kind:
                    var disabled = record.DeactivatedAtUtc is not null
                        && entry.Property(nameof(IManagedRecord.DeactivatedAtUtc)).IsModified;
                    var action = disabled ? "Deactivated" : entry.State == EntityState.Added ? "Created" : "Edited";
                    var changes = disabled ? [] : CaptureFields(entry, references);
                    if (action != "Edited" || changes.Count > 0) Add(record, kind, action, changes);
                    break;
                case PartyEventProduct line when parties.TryGetValue(line.PartyEventId, out var party):
                    var lineDisabled = entry.Property(nameof(PartyEventProduct.DeactivatedAtUtc)).IsModified;
                    var lineAction = lineDisabled ? "ItemDeactivated" : entry.State == EntityState.Added ? "ItemAdded" : "ItemEdited";
                    var lineChanges = lineDisabled ? [] : CaptureFields(entry, references);
                    if (lineAction == "ItemEdited" && lineChanges.Count == 0) break;
                    if (lineAction != "ItemAdded") lineChanges.Insert(0, new Change(nameof(line.ProductName), null, line.ProductName));
                    Add(party, RecordKind.PartyEvent, lineAction, lineChanges);
                    break;
                case LoanPayment payment when entry.State == EntityState.Added && loans.TryGetValue(payment.LoanId, out var loan):
                    Add(loan, RecordKind.Loan, "PaymentRegistered", CaptureFields(entry, references));
                    break;
                case SaleInstallmentPayment payment when entry.State == EntityState.Added && sales.TryGetValue(payment.SaleId, out var sale):
                    Add(sale, RecordKind.Sale, "PaymentRegistered", CaptureFields(entry, references));
                    break;
            }
        }

        return result;

        void Add(IManagedRecord record, RecordKind kind, string action, IReadOnlyList<Change> changes)
        {
            var module = record is Customer customer ? customer.Module : RecordModule.For(kind)!.Value;
            result.Add(new RecordAudit(Guid.NewGuid(), record.AccountId, module, kind, record.Id,
                NameOf(record), actor.Id, actor.Name, now, action, JsonSerializer.Serialize(changes, JsonOptions)));
        }
    }

    private static List<Change> CaptureFields(EntityEntry entry, Dictionary<Guid, string> references)
    {
        var isNew = entry.State == EntityState.Added;
        return entry.Properties
            .Where(property => (isNew || property.IsModified) && IsAudited(property.Metadata.Name)
                && (isNew ? property.CurrentValue is not null : !Equals(property.OriginalValue, property.CurrentValue)))
            .Select(property => new Change(property.Metadata.Name,
                isNew ? null : DisplayValue(property.OriginalValue, references),
                DisplayValue(property.CurrentValue, references))).ToList();
    }

    private static bool IsAudited(string name) => name is not (
        "Id" or "AccountId" or "Module" or "DeactivatedAtUtc" or "CreatedAtUtc" or "SoldAtUtc"
        or "RequestId" or "LoanId" or "SaleId" or "PartyEventId" or "PaidByUserId" or "PaidByUserName");

    private static object? DisplayValue(object? value, Dictionary<Guid, string> references)
    {
        if (value is Guid id)
            return references.TryGetValue(id, out var label) ? label : null;
        return value;
    }

    private static RecordKind? KindOf(IManagedRecord record) => record switch
    {
        Customer => RecordKind.Customer,
        Loan => RecordKind.Loan,
        PartyEvent => RecordKind.PartyEvent,
        PartyTheme => RecordKind.PartyTheme,
        PartyProduct => RecordKind.PartyProduct,
        Sale => RecordKind.Sale,
        Product => RecordKind.Product,
        FinanceEntry => RecordKind.FinanceEntry,
        _ => null
    };

    private static string NameOf(IManagedRecord record) => record switch
    {
        Customer customer => customer.Name,
        Loan loan => loan.Customer?.Name ?? "Empréstimo",
        PartyEvent partyEvent => partyEvent.Customer?.Name ?? "Festa",
        PartyTheme theme => theme.Name,
        PartyProduct product => product.Name,
        Sale sale => sale.Product?.Name ?? "Venda",
        Product product => product.Name,
        FinanceEntry entry => entry.Category,
        _ => throw new ArgumentOutOfRangeException(nameof(record))
    };

    private sealed record Change(string Field, object? Before, object? After);
}
