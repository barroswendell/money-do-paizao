namespace MoneyDoPaizao.Domain.Entities;

public sealed class SaleInstallmentPayment
{
    private SaleInstallmentPayment()
    {
    }

    internal SaleInstallmentPayment(Guid saleId, int number, decimal amount, Guid userId, string userName, DateTime paidAtUtc)
    {
        Id = Guid.NewGuid();
        SaleId = saleId;
        Number = number;
        Amount = amount;
        PaidByUserId = userId;
        PaidByUserName = userName;
        PaidAtUtc = paidAtUtc;
    }

    public Guid Id { get; private set; }
    public Guid SaleId { get; private set; }
    public int Number { get; private set; }
    public decimal Amount { get; private set; }
    public Guid PaidByUserId { get; private set; }
    public string PaidByUserName { get; private set; } = string.Empty;
    public DateTime PaidAtUtc { get; private set; }
}
