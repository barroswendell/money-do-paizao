using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class LoanPayment
{
    private LoanPayment()
    {
    }

    private LoanPayment(
        Guid accountId,
        Guid loanId,
        LoanPaymentType type,
        decimal amount,
        decimal interestAmount,
        decimal principalAmount,
        Guid? requestId)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        LoanId = loanId;
        Type = type;
        Amount = amount;
        InterestAmount = interestAmount;
        PrincipalAmount = principalAmount;
        RequestId = requestId;
        PaidAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public Guid LoanId { get; private set; }
    public Loan? Loan { get; private set; }
    public LoanPaymentType Type { get; private set; }
    public decimal Amount { get; private set; }
    public decimal InterestAmount { get; private set; }
    public decimal PrincipalAmount { get; private set; }
    public Guid? RequestId { get; private set; }
    public string? ReceiptName { get; private set; }
    public LoanPaymentReceipt? Receipt { get; private set; }
    public DateTime PaidAtUtc { get; private set; }

    public static LoanPayment Create(
        Guid accountId,
        Guid loanId,
        LoanPaymentType type,
        decimal amount,
        decimal interestAmount,
        decimal principalAmount,
        Guid? requestId = null)
    {
        return new LoanPayment(accountId, loanId, type, amount, interestAmount, principalAmount, requestId);
    }

    public void AttachReceipt(string name, string contentType, byte[] content)
    {
        ReceiptName = name;
        Receipt = new LoanPaymentReceipt(Id, contentType, content);
    }
}
