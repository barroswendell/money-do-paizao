using System.Diagnostics;

namespace MoneyDoPaizao.Api.Middleware;

public sealed class RequestLoggingMiddleware(
    RequestDelegate next,
    ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var traceId = context.TraceIdentifier;
        var isHealthCheck = context.Request.Path.StartsWithSegments("/health");
        var logLevel = isHealthCheck ? LogLevel.Debug : LogLevel.Information;

        logger.Log(
            logLevel,
            "Requisição iniciada: {Method} {Path} TraceId={TraceId}",
            context.Request.Method,
            context.Request.Path,
            traceId);

        try
        {
            await next(context);
        }
        finally
        {
            stopwatch.Stop();
            logger.Log(
                logLevel,
                "Requisição concluída: {Method} {Path} StatusCode={StatusCode} DuraçãoMs={DurationMs} TraceId={TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds,
                traceId);
        }
    }
}
