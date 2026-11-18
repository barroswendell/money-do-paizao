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
            .Where(item => item.AccountId == accountId)
            .AsNoTracking()
            .OrderByDescending(item => item.SoldAtUtc)
            .ToListAsync(cancellationToken);
    }

    public Task<Sale?> GetByIdAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default)
    {
        return context.Sales.SingleOrDefaultAsync(item => item.AccountId == accountId && item.Id == id, cancellationToken);
    }

    public async Task AddAsync(Sale sale, CancellationToken cancellationToken = default) => await context.Sales.AddAsync(sale, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => context.SaveChangesAsync(cancellationToken);
}
