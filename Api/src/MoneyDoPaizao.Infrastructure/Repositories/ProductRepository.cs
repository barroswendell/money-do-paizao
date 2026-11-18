using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class ProductRepository(MoneyDoPaizaoDbContext context) : IProductRepository
{
    public async Task<IReadOnlyList<Product>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await context.Products.Where(item => item.AccountId == accountId).AsNoTracking().OrderBy(item => item.Name).ToListAsync(cancellationToken);
    }

    public Task<Product?> GetByIdAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default)
    {
        return context.Products.SingleOrDefaultAsync(item => item.AccountId == accountId && item.Id == id, cancellationToken);
    }

    public async Task AddAsync(Product product, CancellationToken cancellationToken = default) => await context.Products.AddAsync(product, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => context.SaveChangesAsync(cancellationToken);
}
