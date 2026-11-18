using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Interfaces;

public interface IAccountModuleRepository
{
    Task<IReadOnlyList<AccountModule>> GetByAccountIdAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<AccountModule?> GetAsync(Guid accountId, ProductModule module, CancellationToken cancellationToken = default);
    Task AddAsync(AccountModule accountModule, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
