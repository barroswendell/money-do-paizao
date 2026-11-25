using MoneyDoPaizao.Application.Customers;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class CustomerService(ICustomerRepository customerRepository, IManagedRecordStore records) : ICustomerService
{
    public async Task<CustomerResponse> CreateAsync(Guid accountId, ProductModule module, CustomerCreateRequest request, CancellationToken cancellationToken = default)
    {
        var phone = Validate(request, allowMissingPhone: false);
        var customer = Customer.Create(accountId, module, request.Name, request.HasReferral, request.Referral, phone!);
        await customerRepository.AddAsync(customer, cancellationToken);
        await customerRepository.SaveChangesAsync(cancellationToken);
        return Map(customer);
    }

    public async Task<CustomerResponse?> UpdateAsync(Guid accountId, ProductModule module, Guid id, CustomerCreateRequest request, CancellationToken cancellationToken = default)
    {
        var customer = await records.ChangeAsync<Customer>(accountId, module, id, current =>
        {
            var phone = Validate(request, allowMissingPhone: current.Phone is null);
            current.Update(request.Name, request.HasReferral, request.Referral, phone);
            return Task.CompletedTask;
        }, cancellationToken);
        return customer is null ? null : Map(customer);
    }

    private static string? Validate(CustomerCreateRequest request, bool allowMissingPhone)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length is < 3 or > 160)
        {
            throw new BusinessValidationException("Informe o nome completo do cliente.");
        }

        if (request.HasReferral && (string.IsNullOrWhiteSpace(request.Referral) || request.Referral.Trim().Length > 160))
        {
            throw new BusinessValidationException("Informe a indicação do cliente.");
        }

        var phoneInput = request.Phone?.Trim() ?? string.Empty;
        if (allowMissingPhone && phoneInput.Length == 0) return null;
        var phone = new string(phoneInput.Where(char.IsAsciiDigit).ToArray());
        if (phone.Length is < 10 or > 11 || phoneInput.Any(character =>
            !char.IsAsciiDigit(character) && character is not ('(' or ')' or ' ' or '-')))
        {
            throw new BusinessValidationException("Informe um telefone válido com DDD.");
        }

        return phone;
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
    Task<CustomerResponse?> UpdateAsync(Guid accountId, ProductModule module, Guid id, CustomerCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CustomerResponse>> GetAllAsync(Guid accountId, ProductModule module, CancellationToken cancellationToken = default);
}
