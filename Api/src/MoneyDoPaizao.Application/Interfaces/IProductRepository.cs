using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Interfaces;

public interface IProductRepository
{
    Task<IReadOnlyList<Product>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<Product?> GetByIdAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Product product, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
