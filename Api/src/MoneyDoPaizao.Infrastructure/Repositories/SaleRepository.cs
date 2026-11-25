using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class SaleRepository(MoneyDoPaizaoDbContext context) : ISaleRepository
{
    public async Task<IReadOnlyList<Sale>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await context.Sales
            .Include(item => item.Customer)
            .Include(item => item.Product)
            .Include(item => item.InstallmentPayments)
            .Where(item => item.AccountId == accountId && item.DeactivatedAtUtc == null)
            .AsNoTracking()
            .OrderByDescending(item => item.SoldAtUtc)
            .ThenByDescending(item => item.Id)
            .ToListAsync(cancellationToken);
    }

    public Task<Sale?> GetByIdAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default)
    {
        return context.Sales
            .Include(item => item.Customer)
            .Include(item => item.Product)
            .Include(item => item.InstallmentPayments)
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.AccountId == accountId && item.DeactivatedAtUtc == null && item.Id == id, cancellationToken);
    }

    public async Task<Sale?> RegisterInstallmentPaymentAsync(Guid accountId, Guid id, Func<Sale, SaleInstallmentPayment?> pay, CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        // Read the ledger after locking the sale so repeated and concurrent requests agree on its balance.
        var sale = await context.Sales
            .FromSql($"SELECT * FROM sales WHERE account_id = {accountId} AND id = {id} AND deactivated_at_utc IS NULL FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
        if (sale is null) return null;

        await context.Entry(sale).Reference(item => item.Customer).LoadAsync(cancellationToken);
        await context.Entry(sale).Reference(item => item.Product).LoadAsync(cancellationToken);
        await context.Entry(sale).Collection(item => item.InstallmentPayments).LoadAsync(cancellationToken);
        if (pay(sale) is { } payment)
        {
            context.SaleInstallmentPayments.Add(payment);
            await context.SaveChangesAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
        return sale;
    }

    public async Task AddAsync(Sale sale, CancellationToken cancellationToken = default) => await context.Sales.AddAsync(sale, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => context.SaveChangesAsync(cancellationToken);
}
