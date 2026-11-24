using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Application.Loans;

namespace MoneyDoPaizao.Application.Interfaces;

public interface ILoanRepository
{
    Task<IReadOnlyList<Loan>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task AddAsync(Loan loan, CancellationToken cancellationToken = default);
    Task<Loan?> RegisterPaymentAsync(Guid accountId, Guid id, Func<Loan, LoanPayment?> registerPayment, CancellationToken cancellationToken = default);
    Task<LoanPaymentAttachment?> GetPaymentReceiptAsync(Guid accountId, Guid id, Guid paymentId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
