using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Interfaces;

public interface ILoanRepository
{
    Task<IReadOnlyList<Loan>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<Loan?> GetByIdAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Loan loan, CancellationToken cancellationToken = default);
    Task AddPaymentAsync(LoanPayment payment, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
