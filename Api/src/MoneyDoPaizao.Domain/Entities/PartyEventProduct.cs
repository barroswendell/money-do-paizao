namespace MoneyDoPaizao.Domain.Entities;

public sealed class PartyEventProduct
{
    private PartyEventProduct()
    {
    }

    public Guid Id { get; private set; }
    public Guid PartyEventId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public bool IsGift { get; private set; }

    public static PartyEventProduct Create(PartyProduct product, decimal amount, bool isGift) => new()
    {
        Id = Guid.NewGuid(),
        ProductId = product.Id,
        ProductName = product.Name,
        Amount = isGift ? 0 : amount,
        IsGift = isGift
    };
}
