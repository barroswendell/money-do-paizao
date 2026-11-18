using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Interfaces;

public interface ICustomerRepository
{
    Task<IReadOnlyList<Customer>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<Customer?> GetByIdAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Customer customer, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
