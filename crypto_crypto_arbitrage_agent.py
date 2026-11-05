#!/usr/bin/env python3
"""
Crypto-to-Crypto Arbitrage Agent
Безопасный арбитраж без банковских переводов - только криптовалюты
"""

import json
import time
import random
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

# Configuration
CONFIG_FILE = "crypto_crypto_arbitrage_config.json"
LOG_FILE = "crypto_crypto_arbitrage_logs.txt"
RESULTS_FILE = "crypto_crypto_arbitrage_results.json"

class ArbitrageType(Enum):
    INTER_EXCHANGE = "inter_exchange"
    TRIANGULAR = "triangular"

@dataclass
class ExchangePrice:
    exchange: str
    pair: str
    price: float
    volume_24h: float
    timestamp: datetime

@dataclass
class ArbitrageOpportunity:
    type: ArbitrageType
    pair: str
    buy_exchange: str
    sell_exchange: str
    buy_price: float
    sell_price: float
    profit_percentage: float
    estimated_profit_usd: float
    volume: float
    timestamp: datetime

@dataclass
class TradeExecution:
    opportunity: ArbitrageOpportunity
    buy_amount: float
    sell_amount: float
    fees: float
    net_profit: float
    timestamp: datetime

class CryptoCryptoArbitrageAgent:
    def __init__(self, config_file: str = CONFIG_FILE):
        self.config = self.load_config(config_file)
        self.logger = self.setup_logging()
        self.results = {
            "opportunities": [],
            "executed_trades": [],
            "prices": {},
            "errors": []
        }
        
    def load_config(self, config_file: str) -> Dict:
        """Load configuration from JSON file"""
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.error(f"Configuration file {config_file} not found")
            raise
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in configuration file: {e}")
            raise
    
    def setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logger = logging.getLogger('crypto_crypto_arbitrage')
        logger.setLevel(logging.INFO)
        
        # File handler
        file_handler = logging.FileHandler(LOG_FILE)
        file_handler.setLevel(logging.INFO)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def mock_fetch_exchange_prices(self, exchange: str, pair: str) -> ExchangePrice:
        """Mock fetching prices from exchanges"""
        # Simulate price differences between exchanges
        base_price = 25000  # BTC/USDT base price
        
        if exchange == "bybit":
            price = base_price + random.uniform(-50, 50)
        elif exchange == "kucoin":
            price = base_price + random.uniform(-30, 30)
        elif exchange == "binance":
            price = base_price + random.uniform(-20, 20)
        else:
            price = base_price
        
        volume = random.uniform(1000000, 5000000)
        
        return ExchangePrice(
            exchange=exchange,
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def fetch_all_prices(self) -> Dict[str, List[ExchangePrice]]:
        """Fetch prices from all exchanges for all pairs"""
        all_prices = {}
        
        for exchange, config in self.config["crypto_crypto_arbitrage_agent"]["target_exchanges"].items():
            all_prices[exchange] = []
            
            for pair in config["pairs"]:
                price_data = self.mock_fetch_exchange_prices(exchange, pair)
                all_prices[exchange].append(price_data)
        
        return all_prices
    
    def find_inter_exchange_arbitrage(self, all_prices: Dict[str, List[ExchangePrice]]) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities between different exchanges"""
        opportunities = []
        
        for pair in ["BTC/USDT", "ETH/USDT", "BNB/USDT", "XRP/USDT"]:
            # Get prices for this pair from all exchanges
            pair_prices = {}
            for exchange, prices in all_prices.items():
                for price_data in prices:
                    if price_data.pair == pair:
                        pair_prices[exchange] = price_data
            
            if len(pair_prices) >= 2:
                # Find min and max prices
                min_exchange = min(pair_prices.items(), key=lambda x: x[1].price)
                max_exchange = max(pair_prices.items(), key=lambda x: x[1].price)
                
                buy_exchange, buy_price = min_exchange
                sell_exchange, sell_price = max_exchange
                
                price_diff = sell_price.price - buy_price.price
                profit_percentage = (price_diff / buy_price.price)
                
                # Check if profit meets threshold
                threshold = self.config["crypto_crypto_arbitrage_agent"]["arbitrage_strategies"]["inter_exchange"]["min_profit_threshold"]
                if profit_percentage >= threshold:
                    # Calculate estimated profit
                    volume = 0.01  # 0.01 BTC
                    estimated_profit_usd = price_diff * volume
                    
                    opportunity = ArbitrageOpportunity(
                        type=ArbitrageType.INTER_EXCHANGE,
                        pair=pair,
                        buy_exchange=buy_exchange,
                        sell_exchange=sell_exchange,
                        buy_price=buy_price.price,
                        sell_price=sell_price.price,
                        profit_percentage=profit_percentage,
                        estimated_profit_usd=estimated_profit_usd,
                        volume=volume,
                        timestamp=datetime.now()
                    )
                    opportunities.append(opportunity)
        
        return opportunities
    
    def find_triangular_arbitrage(self, all_prices: Dict[str, List[ExchangePrice]]) -> List[ArbitrageOpportunity]:
        """Find triangular arbitrage opportunities"""
        opportunities = []
        
        # Example: BTC/USDT → ETH/USDT → ETH/BTC → BTC/USDT
        # This is simplified - in reality we'd need to check all triangular combinations
        
        # Mock triangular opportunity
        if random.random() < 0.1:  # 10% chance to find triangular opportunity
            base_price = 25000  # BTC/USDT
            eth_price = 1250    # ETH/USDT
            btc_eth_price = 0.05  # ETH/BTC
            
            # Calculate triangular profit
            btc_amount = 1
            eth_amount = btc_amount / btc_eth_price
            btc_back = eth_amount * eth_price / base_price
            
            profit_percentage = (btc_back - btc_amount) / btc_amount
            
            threshold = self.config["crypto_crypto_arbitrage_agent"]["arbitrage_strategies"]["triangular"]["min_profit_threshold"]
            if profit_percentage >= threshold:
                opportunity = ArbitrageOpportunity(
                    type=ArbitrageType.TRIANGULAR,
                    pair="BTC/USDT-ETH/USDT-ETH/BTC",
                    buy_exchange="binance",
                    sell_exchange="kucoin",
                    buy_price=base_price,
                    sell_price=base_price * (1 + profit_percentage),
                    profit_percentage=profit_percentage,
                    estimated_profit_usd=profit_percentage * 1000,
                    volume=1.0,
                    timestamp=datetime.now()
                )
                opportunities.append(opportunity)
        
        return opportunities
    
    def execute_trade(self, opportunity: ArbitrageOpportunity) -> Optional[TradeExecution]:
        """Execute a trade (mock implementation)"""
        try:
            # Calculate fees
            buy_fee = opportunity.buy_price * opportunity.volume * self.config["crypto_crypto_arbitrage_agent"]["target_exchanges"][opportunity.buy_exchange]["fee"]
            sell_fee = opportunity.sell_price * opportunity.volume * self.config["crypto_crypto_arbitrage_agent"]["target_exchanges"][opportunity.sell_exchange]["fee"]
            total_fees = buy_fee + sell_fee
            
            # Calculate net profit
            gross_profit = (opportunity.sell_price - opportunity.buy_price) * opportunity.volume
            net_profit = gross_profit - total_fees
            
            # Create trade execution
            execution = TradeExecution(
                opportunity=opportunity,
                buy_amount=opportunity.volume,
                sell_amount=opportunity.volume,
                fees=total_fees,
                net_profit=net_profit,
                timestamp=datetime.now()
            )
            
            self.results["executed_trades"].append(execution)
            return execution
            
        except Exception as e:
            self.logger.error(f"Error executing trade: {e}")
            return None
    
    def run_monitoring_cycle(self) -> Dict[str, Any]:
        """Run one complete monitoring cycle"""
        self.logger.info("Starting crypto-crypto arbitrage monitoring cycle...")
        
        try:
            # Fetch prices from all exchanges
            self.logger.info("Fetching prices from exchanges...")
            all_prices = self.fetch_all_prices()
            
            # Store prices
            self.results["prices"] = {
                exchange: [
                    {
                        "pair": p.pair,
                        "price": p.price,
                        "volume_24h": p.volume_24h,
                        "timestamp": p.timestamp.isoformat()
                    }
                    for p in prices
                ]
                for exchange, prices in all_prices.items()
            }
            
            # Find inter-exchange arbitrage opportunities
            self.logger.info("Searching for inter-exchange arbitrage opportunities...")
            inter_exchange_opps = self.find_inter_exchange_arbitrage(all_prices)
            self.results["opportunities"].extend([
                {
                    "type": opp.type.value,
                    "pair": opp.pair,
                    "buy_exchange": opp.buy_exchange,
                    "sell_exchange": opp.sell_exchange,
                    "buy_price": opp.buy_price,
                    "sell_price": opp.sell_price,
                    "profit_percentage": opp.profit_percentage,
                    "estimated_profit_usd": opp.estimated_profit_usd,
                    "volume": opp.volume,
                    "timestamp": opp.timestamp.isoformat()
                }
                for opp in inter_exchange_opps
            ])
            
            # Find triangular arbitrage opportunities
            self.logger.info("Searching for triangular arbitrage opportunities...")
            triangular_opps = self.find_triangular_arbitrage(all_prices)
            self.results["opportunities"].extend([
                {
                    "type": opp.type.value,
                    "pair": opp.pair,
                    "buy_exchange": opp.buy_exchange,
                    "sell_exchange": opp.sell_exchange,
                    "buy_price": opp.buy_price,
                    "sell_price": opp.sell_price,
                    "profit_percentage": opp.profit_percentage,
                    "estimated_profit_usd": opp.estimated_profit_usd,
                    "volume": opp.volume,
                    "timestamp": opp.timestamp.isoformat()
                }
                for opp in triangular_opps
            ])
            
            # Execute profitable trades
            self.logger.info("Executing profitable trades...")
            for opportunity in inter_exchange_opps + triangular_opps:
                if opportunity.profit_percentage >= 0.01:  # 1% threshold
                    execution = self.execute_trade(opportunity)
                    if execution:
                        self.logger.info(f"Executed trade: {execution.net_profit:.2f} USD profit")
            
            # Save results
            self.save_results()
            
            # Generate alerts
            self.generate_alerts()
            
            self.logger.info("Monitoring cycle completed successfully")
            
            return {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "opportunities_found": len(inter_exchange_opps + triangular_opps),
                "trades_executed": len([t for t in self.results["executed_trades"] if t.timestamp >= datetime.now() - timedelta(minutes=5)]),
                "total_profit": sum(t.net_profit for t in self.results["executed_trades"] if t.timestamp >= datetime.now() - timedelta(minutes=5))
            }
            
        except Exception as e:
            self.logger.error(f"Error in monitoring cycle: {e}")
            self.results["errors"].append(f"Cycle error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def generate_alerts(self) -> Dict[str, List[str]]:
        """Generate alerts based on thresholds"""
        alerts = {
            "high_profit_opportunity": [],
            "price_anomaly": [],
            "trade_executed": []
        }
        
        # High profit opportunity alerts
        for opp in self.results["opportunities"]:
            if opp["profit_percentage"] >= 0.02:  # 2% threshold
                alerts["high_profit_opportunity"].append(
                    f"{opp['pair']}: {opp['buy_exchange']} → {opp['sell_exchange']} ({opp['profit_percentage']:.2%})"
                )
        
        # Trade execution alerts
        for trade in self.results["executed_trades"]:
            if trade.net_profit >= 100:  # $100 threshold
                alerts["trade_executed"].append(
                    f"{trade.opportunity.pair}: ${trade.net_profit:.2f} profit"
                )
        
        return alerts
    
    def save_results(self) -> None:
        """Save results to file"""
        with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        self.logger.info(f"Results saved to {RESULTS_FILE}")
    
    def run_continuous(self, interval_minutes: int = 5) -> None:
        """Run agent continuously"""
        self.logger.info(f"Starting continuous monitoring with {interval_minutes} minute intervals")
        
        while True:
            try:
                result = self.run_monitoring_cycle()
                
                if result["status"] == "success":
                    self.logger.info(f"Cycle completed: {result['opportunities_found']} opportunities found, {result['trades_executed']} trades executed")
                
                time.sleep(interval_minutes * 60)
                
            except KeyboardInterrupt:
                self.logger.info("Received keyboard interrupt, stopping...")
                break
            except Exception as e:
                self.logger.error(f"Error in continuous mode: {e}")
                time.sleep(60)  # Wait before retrying
    
    def run_single_cycle(self) -> None:
        """Run single monitoring cycle"""
        result = self.run_monitoring_cycle()
        
        if result["status"] == "success":
            print(f"✅ Cycle completed successfully!")
            print(f"📊 Opportunities found: {result['opportunities_found']}")
            print(f"💰 Trades executed: {result['trades_executed']}")
            print(f"🎯 Total profit: ${result['total_profit']:.2f}")
        else:
            print(f"❌ Error: {result['error']}")

def main():
    parser = argparse.ArgumentParser(description="Crypto-to-Crypto Arbitrage Agent")
    parser.add_argument("--config", default=CONFIG_FILE, help="Configuration file path")
    parser.add_argument("--continuous", action="store_true", help="Run continuously")
    parser.add_argument("--interval", type=int, default=5, help="Interval in minutes for continuous mode")
    parser.add_argument("--single", action="store_true", help="Run single cycle only")
    parser.add_argument("--status", action="store_true", help="Show current status")
    
    args = parser.parse_args()
    
    try:
        agent = CryptoCryptoArbitrageAgent(args.config)
        
        if args.status:
            # Show current status
            if os.path.exists(RESULTS_FILE):
                with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                
                print("📊 Current Status:")
                print(f"Total opportunities: {len(results['opportunities'])}")
                print(f"Total trades: {len(results['executed_trades'])}")
                print(f"Recent profit: ${sum(t['net_profit'] for t in results['executed_trades'][-10:]):.2f}")
            else:
                print("No results file found")
            return
        
        if args.single:
            agent.run_single_cycle()
        elif args.continuous:
            agent.run_continuous(args.interval)
        else:
            print("Crypto-to-Crypto Arbitrage Agent")
            print("=" * 50)
            print("This agent finds arbitrage opportunities between cryptocurrency exchanges")
            print("without using bank transfers - only cryptocurrency transactions!")
            print()
            print("Use --continuous for continuous monitoring")
            print("Use --single for single cycle")
            print("Use --status to check current status")
            print()
            print("🎯 Benefits:")
            print("• No bank involvement - no 115 FZ risk!")
            print("• Only cryptocurrency transactions")
            print("• Automated profit detection")
            print("• Low risk with small positions")
            
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    import os
    exit(main())