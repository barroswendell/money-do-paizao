using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyDoPaizao.Api.Security;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Sales;
using MoneyDoPaizao.Application.Services;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/sales")]
public sealed class SalesController(ISalesService salesService) : ControllerBase
{
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Sales")) return Forbid();
        return Ok(await salesService.GetDashboardAsync(AccountId, cancellationToken));
    }

    [HttpGet("products")]
    public async Task<IActionResult> Products(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Sales")) return Forbid();
        return Ok(await salesService.GetProductsAsync(AccountId, cancellationToken));
    }

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct(ProductCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Sales")) return Forbid();
        try
        {
            return Created("api/sales/products", await salesService.CreateProductAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetSales(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Sales")) return Forbid();
        return Ok(await salesService.GetSalesAsync(AccountId, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> CreateSale(SaleCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Sales")) return Forbid();
        try
        {
            return Created("api/sales", await salesService.CreateSaleAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:guid}/pay")]
    public async Task<IActionResult> MarkAsPaid(Guid id, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Sales")) return Forbid();
        try
        {
            return Ok(await salesService.MarkAsPaidAsync(AccountId, id, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
