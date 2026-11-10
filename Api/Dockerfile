FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Api/ ./Api/
RUN dotnet restore Api/src/MoneyDoPaizao.Api/MoneyDoPaizao.Api.csproj
RUN dotnet publish Api/src/MoneyDoPaizao.Api/MoneyDoPaizao.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MoneyDoPaizao.Api.dll"]
