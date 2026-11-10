using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Services;
using MoneyDoPaizao.Infrastructure.Persistence;
using MoneyDoPaizao.Infrastructure.Repositories;
using MoneyDoPaizao.Infrastructure.Security;
using MoneyDoPaizao.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

var jwtKey = builder.Configuration["Jwt:Key"]
             ?? throw new InvalidOperationException("Jwt:Key não foi configurada.");

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Development", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddDbContext<MoneyDoPaizaoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<ILoanRepository, LoanRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasherService>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<ILoanService, LoanService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Development");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/db", async (
    MoneyDoPaizaoDbContext context,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    try
    {
        var connected = await context.Database.CanConnectAsync(cancellationToken);
        if (!connected)
        {
            logger.LogError("Health check do banco falhou: não foi possível conectar ao PostgreSQL.");
            return Results.Json(
                new { status = "error", database = "unavailable" },
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        logger.LogInformation("Health check do banco concluído com sucesso.");
        return Results.Ok(new { status = "ok", database = "connected" });
    }
    catch (Exception exception)
    {
        logger.LogError(exception, "Health check do banco falhou com exceção.");
        return Results.Json(
            new { status = "error", database = "unavailable" },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("Iniciando inicialização do banco de dados.");
        var createdApplicationTables = await DatabaseSeeder.InitializeAsync(scope.ServiceProvider, app.Configuration);
        logger.LogInformation(
            createdApplicationTables
                ? "Tabelas do aplicativo criadas no schema public."
                : "Tabelas do aplicativo já estavam disponíveis no schema public.");
        logger.LogInformation("Inicialização do banco de dados concluída.");
    }
    catch (Exception exception)
    {
        logger.LogCritical(exception, "Falha ao inicializar o banco de dados. A API subirá, mas operações que consultam o banco poderão falhar.");
    }
}

app.Run();

public partial class Program;
