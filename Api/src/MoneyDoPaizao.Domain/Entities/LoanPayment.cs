using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class LoanPayment
{
    private LoanPayment()
    {
    }

    private LoanPayment(
        Guid loanId,
        LoanPaymentType type,
        decimal amount,
        decimal interestAmount,
        decimal principalAmount)
    {
        Id = Guid.NewGuid();
        LoanId = loanId;
        Type = type;
        Amount = amount;
        InterestAmount = interestAmount;
        PrincipalAmount = principalAmount;
        PaidAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid LoanId { get; private set; }
    public Loan? Loan { get; private set; }
    public LoanPaymentType Type { get; private set; }
    public decimal Amount { get; private set; }
    public decimal InterestAmount { get; private set; }
    public decimal PrincipalAmount { get; private set; }
    public DateTime PaidAtUtc { get; private set; }

    public static LoanPayment Create(
        Guid loanId,
        LoanPaymentType type,
        decimal amount,
        decimal interestAmount,
        decimal principalAmount)
    {
        return new LoanPayment(loanId, type, amount, interestAmount, principalAmount);
    }
}
