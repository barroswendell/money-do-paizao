using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Interfaces;

public interface IPersonalFinanceRepository
{
    Task<IReadOnlyList<FinanceEntry>> GetEntriesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task AddAsync(FinanceEntry entry, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
