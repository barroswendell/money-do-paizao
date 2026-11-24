using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class ProductRepository(MoneyDoPaizaoDbContext context) : IProductRepository
{
    private static readonly string[] DefaultProductNames = ["Televisão", "Ventilador", "Caixa de som", "Air fryer"];

    public async Task<IReadOnlyList<Product>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var products = await ListProductsAsync(accountId, cancellationToken);
        var missingNames = DefaultProductNames.Except(products.Select(item => item.Name), StringComparer.OrdinalIgnoreCase).ToArray();
        if (missingNames.Length == 0) return products;

        // Stable per-account IDs allow concurrent requests to provision the same catalog safely.
        await context.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO products (id, account_id, name, brand, price, created_at_utc)
            SELECT CAST(md5(CAST({accountId} AS text) || ':default-product:' || seed.name) AS uuid),
                   {accountId}, seed.name, '', 0, now()
            FROM unnest(CAST({missingNames} AS text[])) AS seed(name)
            ON CONFLICT (id) DO NOTHING
            """, cancellationToken);
        return await ListProductsAsync(accountId, cancellationToken);
    }

    private Task<List<Product>> ListProductsAsync(Guid accountId, CancellationToken cancellationToken) =>
        context.Products.Where(item => item.AccountId == accountId).AsNoTracking().OrderBy(item => item.Name).ToListAsync(cancellationToken);

    public Task<Product?> GetByIdAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default)
    {
        return context.Products.SingleOrDefaultAsync(item => item.AccountId == accountId && item.Id == id, cancellationToken);
    }

    public async Task AddAsync(Product product, CancellationToken cancellationToken = default) => await context.Products.AddAsync(product, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => context.SaveChangesAsync(cancellationToken);
}
