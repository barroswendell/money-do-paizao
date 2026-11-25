using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class ManagedRecordStore(MoneyDoPaizaoDbContext context) : IManagedRecordStore
{
    public async Task<T?> ChangeAsync<T>(Guid accountId, ProductModule module, Guid id, Func<T, Task> change, CancellationToken cancellationToken)
        where T : class, IManagedRecord
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var record = await LockAsync<T>(accountId, module, id, cancellationToken);
        if (record is null) return null;

        await LoadDetailsAsync(record, cancellationToken);
        var existingLines = (record as PartyEvent)?.Products.Select(item => item.Id).ToHashSet();
        await change(record);
        if (record is PartyEvent party && existingLines is not null)
            context.AddRange(party.Products.Where(item => !existingLines.Contains(item.Id)));
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return record;
    }

    public async Task<bool> DeactivateAsync(Guid accountId, ProductModule module, RecordKind kind, Guid id, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return kind switch
        {
            RecordKind.Customer => await ChangeAsync<Customer>(accountId, module, id, Deactivate, cancellationToken) is not null,
            RecordKind.Loan => await ChangeAsync<Loan>(accountId, module, id, Deactivate, cancellationToken) is not null,
            RecordKind.PartyEvent => await ChangeAsync<PartyEvent>(accountId, module, id, Deactivate, cancellationToken) is not null,
            RecordKind.PartyTheme => await ChangeAsync<PartyTheme>(accountId, module, id, Deactivate, cancellationToken) is not null,
            RecordKind.PartyProduct => await ChangeAsync<PartyProduct>(accountId, module, id, Deactivate, cancellationToken) is not null,
            RecordKind.Sale => await ChangeAsync<Sale>(accountId, module, id, Deactivate, cancellationToken) is not null,
            RecordKind.Product => await ChangeAsync<Product>(accountId, module, id, Deactivate, cancellationToken) is not null,
            RecordKind.FinanceEntry => await ChangeAsync<FinanceEntry>(accountId, module, id, Deactivate, cancellationToken) is not null,
            _ => false
        };

        Task Deactivate(IManagedRecord record)
        {
            record.Deactivate(now);
            return Task.CompletedTask;
        }
    }

    public async Task<IReadOnlyList<RecordAudit>> GetHistoryAsync(Guid accountId, ProductModule module, RecordKind? kind,
        Guid? recordId, int offset, int limit, CancellationToken cancellationToken)
    {
        var query = context.RecordAudits.AsNoTracking().Where(item => item.AccountId == accountId && item.Module == module);
        if (kind.HasValue) query = query.Where(item => item.Kind == kind.Value);
        if (recordId.HasValue) query = query.Where(item => item.RecordId == recordId.Value);

        return await query.OrderByDescending(item => item.OccurredAtUtc).ThenByDescending(item => item.Id)
            .Skip(offset).Take(limit).ToListAsync(cancellationToken);
    }

    private async Task<T?> LockAsync<T>(Guid accountId, ProductModule module, Guid id, CancellationToken cancellationToken)
        where T : class, IManagedRecord
    {
        // Table names are fixed by the EF model. Account and record IDs are SQL parameters.
        var entity = context.Model.FindEntityType(typeof(T))!;
        var table = context.GetService<ISqlGenerationHelper>().DelimitIdentifier(entity.GetTableName()!, entity.GetSchema());
        var statement = $"SELECT * FROM {table} WHERE account_id = {{0}} AND id = {{1}} AND deactivated_at_utc IS NULL FOR UPDATE";
        var query = context.Set<T>().FromSqlRaw(statement, accountId, id);
        var record = await query.SingleOrDefaultAsync(cancellationToken);
        return record is Customer customer && customer.Module != module ? null : record;
    }

    private async Task LoadDetailsAsync(IManagedRecord record, CancellationToken cancellationToken)
    {
        // Keep display references even when their catalog record has been deactivated.
        switch (record)
        {
            case Loan loan:
                await context.Entry(loan).Reference(item => item.Customer).LoadAsync(cancellationToken);
                await context.Entry(loan).Collection(item => item.Payments).LoadAsync(cancellationToken);
                break;
            case Sale sale:
                await context.Entry(sale).Reference(item => item.Customer).LoadAsync(cancellationToken);
                await context.Entry(sale).Reference(item => item.Product).LoadAsync(cancellationToken);
                await context.Entry(sale).Collection(item => item.InstallmentPayments).LoadAsync(cancellationToken);
                break;
            case PartyEvent partyEvent:
                await context.Entry(partyEvent).Reference(item => item.Customer).LoadAsync(cancellationToken);
                await context.Entry(partyEvent).Reference(item => item.Theme).LoadAsync(cancellationToken);
                await context.Entry(partyEvent).Collection(item => item.Products).LoadAsync(cancellationToken);
                break;
        }
    }
}
