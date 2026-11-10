using MoneyDoPaizao.Application.Customers;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;

namespace MoneyDoPaizao.Application.Services;

public sealed class CustomerService(ICustomerRepository customerRepository) : ICustomerService
{
    public async Task<CustomerResponse> CreateAsync(CustomerCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length < 3)
        {
            throw new BusinessValidationException("Informe o nome completo do cliente.");
        }

        if (request.HasReferral && string.IsNullOrWhiteSpace(request.Referral))
        {
            throw new BusinessValidationException("Informe a indicação do cliente.");
        }

        var customer = Customer.Create(request.Name, request.HasReferral, request.Referral);
        await customerRepository.AddAsync(customer, cancellationToken);
        await customerRepository.SaveChangesAsync(cancellationToken);
        return Map(customer);
    }

    public async Task<IReadOnlyList<CustomerResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var customers = await customerRepository.GetAllAsync(cancellationToken);
        return customers.Select(Map).ToList();
    }

    private static CustomerResponse Map(Customer customer)
    {
        return new CustomerResponse(customer.Id, customer.Name, customer.HasReferral, customer.Referral, customer.CreatedAtUtc);
    }
}

public interface ICustomerService
{
    Task<CustomerResponse> CreateAsync(CustomerCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CustomerResponse>> GetAllAsync(CancellationToken cancellationToken = default);
}
