using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Interfaces;

public interface ICustomerRepository
{
    Task<IReadOnlyList<Customer>> GetAllAsync(Guid accountId, ProductModule module, CancellationToken cancellationToken = default);
    Task<Customer?> GetByIdAsync(Guid accountId, ProductModule module, Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Customer customer, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
