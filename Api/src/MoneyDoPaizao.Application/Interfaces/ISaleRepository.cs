using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Interfaces;

public interface ISaleRepository
{
    Task<IReadOnlyList<Sale>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<Sale?> GetByIdAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default);
    Task<Sale?> RegisterInstallmentPaymentAsync(Guid accountId, Guid id, Func<Sale, SaleInstallmentPayment?> pay, CancellationToken cancellationToken = default);
    Task AddAsync(Sale sale, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
