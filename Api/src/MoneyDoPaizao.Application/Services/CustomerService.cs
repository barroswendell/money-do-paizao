using MoneyDoPaizao.Application.Customers;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class CustomerService(ICustomerRepository customerRepository) : ICustomerService
{
    public async Task<CustomerResponse> CreateAsync(Guid accountId, ProductModule module, CustomerCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length < 3)
        {
            throw new BusinessValidationException("Informe o nome completo do cliente.");
        }

        if (request.HasReferral && string.IsNullOrWhiteSpace(request.Referral))
        {
            throw new BusinessValidationException("Informe a indicação do cliente.");
        }

        string? phone = null;
        if (module == ProductModule.Loans && !string.IsNullOrWhiteSpace(request.Phone))
        {
            phone = new string(request.Phone.Where(char.IsAsciiDigit).ToArray());
            if (phone.Length is < 10 or > 11 || request.Phone.Any(character =>
                !char.IsAsciiDigit(character) && character is not ('(' or ')' or ' ' or '-')))
            {
                throw new BusinessValidationException("Informe um telefone válido com DDD.");
            }
        }

        var customer = Customer.Create(accountId, module, request.Name, request.HasReferral, request.Referral, phone);
        await customerRepository.AddAsync(customer, cancellationToken);
        await customerRepository.SaveChangesAsync(cancellationToken);
        return Map(customer);
    }

    public async Task<IReadOnlyList<CustomerResponse>> GetAllAsync(Guid accountId, ProductModule module, CancellationToken cancellationToken = default)
    {
        var customers = await customerRepository.GetAllAsync(accountId, module, cancellationToken);
        return customers.Select(Map).ToList();
    }

    private static CustomerResponse Map(Customer customer)
    {
        return new CustomerResponse(customer.Id, customer.Name, customer.HasReferral, customer.Referral, customer.CreatedAtUtc, customer.Phone);
    }
}

public interface ICustomerService
{
    Task<CustomerResponse> CreateAsync(Guid accountId, ProductModule module, CustomerCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CustomerResponse>> GetAllAsync(Guid accountId, ProductModule module, CancellationToken cancellationToken = default);
}
