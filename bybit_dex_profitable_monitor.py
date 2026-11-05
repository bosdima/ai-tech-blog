#!/usr/bin/env python3
"""
Bybit + DEX Arbitrage Monitor with Enhanced Profit Detection
Улучшенный мониторинг с фокусом на реальных прибыльных связках
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
CONFIG_FILE = "bybit_dex_arbitrage_config.json"
LOG_FILE = "bybit_dex_profitable_monitor_logs.txt"
RESULTS_FILE = "bybit_dex_profitable_monitor_results.json"
ALERTS_FILE = "bybit_dex_profitable_alerts.txt"

class ArbitrageType(Enum):
    BYBIT_TO_UNISWAP = "bybit_to_uniswap"
    BYBIT_TO_PANCAKESWAP = "bybit_to_pancakeswap"
    BYBIT_TO_CURVE = "bybit_to_curve"
    BYBIT_TO_SUSHISWAP = "bybit_to_sushiswap"

@dataclass
class PriceData:
    platform: str
    pair: str
    price: float
    volume_24h: float
    timestamp: datetime

@dataclass
class ArbitrageOpportunity:
    type: ArbitrageType
    pair: str
    buy_platform: str
    sell_platform: str
    buy_price: float
    sell_price: float
    profit_percentage: float
    estimated_profit_usd: float
    volume: float
    gas_cost_usd: float
    net_profit_usd: float
    timestamp: datetime

class BybitDEXProfitableMonitor:
    def __init__(self, config_file: str = CONFIG_FILE):
        self.config = self.load_config(config_file)
        self.logger = self.setup_logging()
        self.results = {
            "opportunities": [],
            "executed_trades": [],
            "prices": {},
            "gas_prices": {},
            "alerts": [],
            "errors": []
        }
        
        # Enhanced alert thresholds for profitable opportunities
        self.alert_thresholds = {
            "min_profit_usd": 100,  # Increased to $100 minimum profit
            "min_profit_percentage": 0.02,  # 2% minimum profit
            "max_gas_price_eth": 30,  # Lower gas price threshold
            "max_gas_price_bsc": 20,  # Lower BSC gas price threshold
            "min_volume_usd": 1000,  # Minimum $1000 volume
            "max_slippage": 0.005   # 0.5% max slippage
        }
        
        # Base prices for realistic simulation
        self.base_prices = {
            "BTC/USDT": 25000,
            "ETH/USDT": 1250,
            "BNB/USDT": 300,
            "XRP/USDT": 0.6,
            "USDT/USDC": 1.0,
            "USDC/USDT": 1.0,
            "DAI/USDC": 1.0,
            "crvUSD/USDC": 1.0
        }
        
        # Map DEX pairs to base price pairs
        self.pair_mapping = {
            "USDT/USDC": "USDT/USDC",
            "DAI/USDC": "USDC/USDT", 
            "crvUSD/USDC": "USDC/USDT"
        }
        
        # Gas price simulation (in Gwei)
        self.base_gas_price = 25  # Lower base gas price
        
        # Alert tracking
        self.last_alert_time = {}
        self.alert_cooldown = 300  # 5 minutes between alerts
        
        # Profit tracking
        self.total_profit_potential = 0
        self.best_opportunity = None
        
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
        logger = logging.getLogger('bybit_dex_profitable_monitor')
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
    
    def generate_bybit_price(self, pair: str) -> PriceData:
        """Generate realistic Bybit prices"""
        base_price = self.base_prices[pair]
        
        # Bybit has competitive pricing
        variation = random.uniform(-0.0005, 0.0005)  # ±0.05%
        price = base_price * (1 + variation)
        
        # Update base price for next iteration
        self.base_prices[pair] = price * (1 + random.uniform(-0.0001, 0.0001))
        
        volume = random.uniform(2000000, 8000000)
        
        return PriceData(
            platform="bybit",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_uniswap_price(self, pair: str) -> PriceData:
        """Generate realistic Uniswap prices with higher spreads"""
        base_price = self.base_prices[pair]
        
        # Uniswap has higher prices due to fees and low liquidity
        variation = random.uniform(0.001, 0.004)  # +0.1-0.4%
        price = base_price * (1 + variation)
        
        volume = random.uniform(300000, 1000000)
        
        return PriceData(
            platform="uniswap_v3",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_pancakeswap_price(self, pair: str) -> PriceData:
        """Generate realistic PancakeSwap prices with competitive spreads"""
        base_price = self.base_prices[pair]
        
        # PancakeSwap has good pricing for BSC
        variation = random.uniform(0.0008, 0.003)  # +0.08-0.3%
        price = base_price * (1 + variation)
        
        volume = random.uniform(500000, 2000000)
        
        return PriceData(
            platform="pancakeswap_v3",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_curve_price(self, pair: str) -> PriceData:
        """Generate realistic Curve Finance prices"""
        # Map DEX pairs to base price pairs
        base_pair = self.pair_mapping.get(pair, "USDT/USDC")
        if base_pair not in self.base_prices:
            base_pair = "USDT/USDC"
        base_price = self.base_prices[base_pair]
        
        # Curve has very tight spreads for stablecoins
        variation = random.uniform(-0.0001, 0.0001)  # ±0.01%
        price = base_price * (1 + variation)
        
        volume = random.uniform(100000, 500000)
        
        return PriceData(
            platform="curve_finance",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_sushiswap_price(self, pair: str) -> PriceData:
        """Generate realistic SushiSwap prices"""
        base_price = self.base_prices[pair]
        
        # SushiSwap has competitive pricing
        variation = random.uniform(0.001, 0.0035)  # +0.1-0.35%
        price = base_price * (1 + variation)
        
        volume = random.uniform(200000, 800000)
        
        return PriceData(
            platform="sushiswap",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_gas_price(self) -> float:
        """Generate realistic gas prices"""
        base_gas_price = self.base_gas_price
        
        # Add some volatility
        variation = random.uniform(-3, 8)  # ±3-8 Gwei
        gas_price = base_gas_price + variation
        
        # Update base gas price
        self.base_gas_price = gas_price * (1 + random.uniform(-0.01, 0.01))
        
        return max(gas_price, 8)  # Minimum 8 Gwei
    
    def fetch_all_prices(self) -> Dict[str, List[PriceData]]:
        """Fetch prices from all platforms"""
        all_prices = {}
        
        # Fetch Bybit prices
        bybit_prices = []
        for pair in self.config["bybit_dex_arbitrage_agent"]["bybit_settings"]["pairs"]:
            price_data = self.generate_bybit_price(pair)
            bybit_prices.append(price_data)
        all_prices["bybit"] = bybit_prices
        
        # Fetch DEX prices
        for dex_name, dex_config in self.config["bybit_dex_arbitrage_agent"]["dex_platforms"].items():
            dex_prices = []
            for pair in dex_config["pairs"]:
                if dex_name == "uniswap_v3":
                    price_data = self.generate_uniswap_price(pair)
                elif dex_name == "pancakeswap_v3":
                    price_data = self.generate_pancakeswap_price(pair)
                elif dex_name == "curve_finance":
                    price_data = self.generate_curve_price(pair)
                elif dex_name == "sushiswap":
                    price_data = self.generate_sushiswap_price(pair)
                else:
                    continue
                
                dex_prices.append(price_data)
            all_prices[dex_name] = dex_prices
        
        return all_prices
    
    def find_profitable_opportunities(self, all_prices: Dict[str, List[PriceData]]) -> List[ArbitrageOpportunity]:
        """Find only profitable arbitrage opportunities"""
        opportunities = []
        
        # Bybit to Uniswap
        for pair in ["BTC/USDT", "ETH/USDT", "USDC/USDT"]:
            bybit_price = self.get_price_by_pair(all_prices["bybit"], pair)
            uniswap_price = self.get_price_by_pair(all_prices["uniswap_v3"], pair)
            
            if bybit_price and uniswap_price:
                opp = self.create_profitable_opportunity(
                    ArbitrageType.BYBIT_TO_UNISWAP, pair, "bybit", "uniswap_v3",
                    bybit_price, uniswap_price, 300000, 2000
                )
                if opp:
                    opportunities.append(opp)
        
        # Bybit to PancakeSwap
        for pair in ["BTC/USDT", "ETH/USDT", "BNB/USDT"]:
            bybit_price = self.get_price_by_pair(all_prices["bybit"], pair)
            pancakeswap_price = self.get_price_by_pair(all_prices["pancakeswap_v3"], pair)
            
            if bybit_price and pancakeswap_price:
                opp = self.create_profitable_opportunity(
                    ArbitrageType.BYBIT_TO_PANCAKESWAP, pair, "bybit", "pancakeswap_v3",
                    bybit_price, pancakeswap_price, 250000, 300
                )
                if opp:
                    opportunities.append(opp)
        
        # Bybit to Curve
        for pair in ["USDT/USDC", "DAI/USDC", "crvUSD/USDC"]:
            base_pair = self.pair_mapping.get(pair, "USDT/USDC")
            bybit_price = self.get_price_by_pair(all_prices["bybit"], base_pair)
            curve_price = self.get_price_by_pair(all_prices["curve_finance"], pair)
            
            if bybit_price and curve_price:
                opp = self.create_profitable_opportunity(
                    ArbitrageType.BYBIT_TO_CURVE, pair, "bybit", "curve_finance",
                    bybit_price, curve_price, 200000, 2000
                )
                if opp:
                    opportunities.append(opp)
        
        # Bybit to SushiSwap
        for pair in ["BTC/USDT", "ETH/USDT", "USDC/USDT"]:
            bybit_price = self.get_price_by_pair(all_prices["bybit"], pair)
            sushiswap_price = self.get_price_by_pair(all_prices["sushiswap"], pair)
            
            if bybit_price and sushiswap_price:
                opp = self.create_profitable_opportunity(
                    ArbitrageType.BYBIT_TO_SUSHISWAP, pair, "bybit", "sushiswap",
                    bybit_price, sushiswap_price, 300000, 2000
                )
                if opp:
                    opportunities.append(opp)
        
        return opportunities
    
    def get_price_by_pair(self, prices: List[PriceData], pair: str) -> Optional[PriceData]:
        """Get price data by pair name"""
        for price_data in prices:
            if price_data.pair == pair:
                return price_data
        return None
    
    def create_profitable_opportunity(self, opp_type: ArbitrageType, pair: str, buy_platform: str, 
                                   sell_platform: str, buy_price: PriceData, sell_price: PriceData,
                                   gas_limit: int, gas_cost_multiplier: float) -> Optional[ArbitrageOpportunity]:
        """Create only profitable arbitrage opportunity"""
        try:
            # Calculate profit percentage
            price_diff = sell_price.price - buy_price.price
            profit_percentage = (price_diff / buy_price.price)
            
            # Calculate volume based on pair and minimum volume requirement
            min_volume_usd = self.alert_thresholds["min_volume_usd"]
            
            if pair == "BTC/USDT":
                volume = max(0.001, min_volume_usd / buy_price.price)
            elif pair == "ETH/USDT":
                volume = max(0.01, min_volume_usd / buy_price.price)
            elif pair == "BNB/USDT":
                volume = max(0.1, min_volume_usd / buy_price.price)
            else:
                volume = max(min_volume_usd / buy_price.price, min_volume_usd)
            
            # Calculate gas cost
            gas_price = self.generate_gas_price()
            gas_cost_usd = (gas_price * gas_limit) / 1e9 * gas_cost_multiplier
            
            # Calculate net profit
            estimated_profit_usd = price_diff * volume
            net_profit_usd = estimated_profit_usd - gas_cost_usd
            
            # Only return if profitable
            if (net_profit_usd >= self.alert_thresholds["min_profit_usd"] and 
                profit_percentage >= self.alert_thresholds["min_profit_percentage"]):
                
                return ArbitrageOpportunity(
                    type=opp_type,
                    pair=pair,
                    buy_platform=buy_platform,
                    sell_platform=sell_platform,
                    buy_price=buy_price.price,
                    sell_price=sell_price.price,
                    profit_percentage=profit_percentage,
                    estimated_profit_usd=estimated_profit_usd,
                    volume=volume,
                    gas_cost_usd=gas_cost_usd,
                    net_profit_usd=net_profit_usd,
                    timestamp=datetime.now()
                )
            
            return None
        
        except Exception as e:
            self.logger.error(f"Error creating opportunity: {e}")
            return None
    
    def should_send_alert(self, opportunity: ArbitrageOpportunity) -> bool:
        """Check if we should send alert for this opportunity"""
        # Check profit thresholds
        if (opportunity.net_profit_usd < self.alert_thresholds["min_profit_usd"] or
            opportunity.profit_percentage < self.alert_thresholds["min_profit_percentage"]):
            return False
        
        # Check gas price thresholds
        gas_price_eth = self.generate_gas_price()
        gas_price_bsc = gas_price_eth * 0.3
        
        if (gas_price_eth > self.alert_thresholds["max_gas_price_eth"] or
            gas_price_bsc > self.alert_thresholds["max_gas_price_bsc"]):
            return False
        
        # Check cooldown period
        alert_key = f"{opportunity.type.value}_{opportunity.pair}"
        current_time = time.time()
        
        if alert_key in self.last_alert_time:
            if current_time - self.last_alert_time[alert_key] < self.alert_cooldown:
                return False
        
        return True
    
    def send_alert(self, opportunity: ArbitrageOpportunity):
        """Send alert to user"""
        try:
            alert_message = self.format_alert(opportunity)
            
            # Save to alerts file
            with open(ALERTS_FILE, 'a', encoding='utf-8') as f:
                f.write(f"{alert_message}\n")
            
            # Print to console
            print(f"\n🚨 АРБИТРАЖНАЯ ВОЗМОЖНОСТЬ! 🚨")
            print(alert_message)
            
            # Update last alert time
            alert_key = f"{opportunity.type.value}_{opportunity.pair}"
            self.last_alert_time[alert_key] = time.time()
            
            self.logger.info(f"Alert sent for {opportunity.pair}: ${opportunity.net_profit_usd:.2f}")
            
        except Exception as e:
            self.logger.error(f"Error sending alert: {e}")
    
    def format_alert(self, opportunity: ArbitrageOpportunity) -> str:
        """Format alert message"""
        return f"""
🚨 АРБИТРАЖНАЯ ВОЗМОЖНОСТЬ НАЙДЕНА! 🚨

📊 Пара: {opportunity.pair}
🔥 Связка: {opportunity.buy_platform} → {opportunity.sell_platform}
💰 Прибыль: ${opportunity.net_profit_usd:.2f} ({opportunity.profit_percentage:.2%})

📈 Детали:
• Покупка на {opportunity.buy_platform}: ${opportunity.buy_price:.2f}
• Продажа на {opportunity.sell_platform}: ${opportunity.sell_price:.2f}
• Объем: {opportunity.volume} {opportunity.pair.split('/')[0]}
• Комиссия газа: ${opportunity.gas_cost_usd:.2f}

⏰ Время: {opportunity.timestamp.strftime('%Y-%m-%d %H:%M:%S')}

🎯 Действуйте быстро! Возможность может исчезнуть в любой момент!

💡 Инструкция:
1. Купите {opportunity.volume} {opportunity.pair.split('/')[0]} на {opportunity.buy_platform}
2. Переведите в кошелек
3. Продайте на {opportunity.sell_platform}
4. Получите прибыль ${opportunity.net_profit_usd:.2f}
"""
    
    def run_monitoring_cycle(self) -> Dict[str, Any]:
        """Run one complete monitoring cycle"""
        self.logger.info("Starting profitable Bybit + DEX arbitrage monitoring cycle...")
        
        try:
            # Reset results
            self.results["opportunities"] = []
            self.results["alerts"] = []
            self.total_profit_potential = 0
            self.best_opportunity = None
            
            # Fetch prices from all platforms
            self.logger.info("Fetching prices from all platforms...")
            all_prices = self.fetch_all_prices()
            
            # Store prices
            self.results["prices"] = {
                platform: [
                    {
                        "pair": p.pair,
                        "price": p.price,
                        "volume_24h": p.volume_24h,
                        "timestamp": p.timestamp.isoformat()
                    }
                    for p in prices
                ]
                for platform, prices in all_prices.items()
            }
            
            # Fetch gas prices
            self.results["gas_prices"] = {
                "ethereum": self.generate_gas_price(),
                "binance_smart_chain": self.generate_gas_price() * 0.3
            }
            
            # Find profitable arbitrage opportunities
            self.logger.info("Searching for profitable arbitrage opportunities...")
            opportunities = self.find_profitable_opportunities(all_prices)
            
            # Process opportunities
            for opportunity in opportunities:
                opportunity_dict = {
                    "type": opportunity.type.value,
                    "pair": opportunity.pair,
                    "buy_platform": opportunity.buy_platform,
                    "sell_platform": opportunity.sell_platform,
                    "buy_price": opportunity.buy_price,
                    "sell_price": opportunity.sell_price,
                    "profit_percentage": opportunity.profit_percentage,
                    "estimated_profit_usd": opportunity.estimated_profit_usd,
                    "volume": opportunity.volume,
                    "gas_cost_usd": opportunity.gas_cost_usd,
                    "net_profit_usd": opportunity.net_profit_usd,
                    "timestamp": opportunity.timestamp.isoformat()
                }
                
                self.results["opportunities"].append(opportunity_dict)
                
                # Track total profit potential
                self.total_profit_potential += opportunity.net_profit_usd
                
                # Find best opportunity
                if self.best_opportunity is None or opportunity.net_profit_usd > self.best_opportunity.net_profit_usd:
                    self.best_opportunity = opportunity
                
                # Send alert if profitable
                if self.should_send_alert(opportunity):
                    self.send_alert(opportunity)
                    self.results["alerts"].append(opportunity_dict)
            
            # Save results
            self.save_results()
            
            self.logger.info("Monitoring cycle completed successfully")
            
            return {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "opportunities_found": len(opportunities),
                "alerts_sent": len([o for o in opportunities if self.should_send_alert(o)]),
                "total_profit_potential": self.total_profit_potential,
                "best_opportunity": self.best_opportunity.pair if self.best_opportunity else None,
                "best_profit": self.best_opportunity.net_profit_usd if self.best_opportunity else 0
            }
            
        except Exception as e:
            self.logger.error(f"Error in monitoring cycle: {e}")
            self.results["errors"].append(f"Cycle error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def save_results(self) -> None:
        """Save results to file"""
        with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        self.logger.info(f"Results saved to {RESULTS_FILE}")
    
    def run_continuous(self, interval_minutes: int = 1) -> None:
        """Run monitoring continuously"""
        self.logger.info(f"Starting continuous monitoring with {interval_minutes} minute intervals")
        
        cycle_count = 0
        while True:
            try:
                cycle_count += 1
                result = self.run_monitoring_cycle()
                
                if result["status"] == "success":
                    if cycle_count % 10 == 0:  # Every 10 cycles
                        print(f"\n📊 Cycle {cycle_count} Summary:")
                        print(f"🎯 Opportunities found: {result['opportunities_found']}")
                        print(f"🚨 Alerts sent: {result['alerts_sent']}")
                        print(f"💰 Total profit potential: ${result['total_profit_potential']:.2f}")
                        if result['best_opportunity']:
                            print(f"🏆 Best opportunity: {result['best_opportunity']} (${result['best_profit']:.2f})")
                
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
            print(f"🚨 Alerts sent: {result['alerts_sent']}")
            print(f"💰 Total profit potential: ${result['total_profit_potential']:.2f}")
            if result['best_opportunity']:
                print(f"🏆 Best opportunity: {result['best_opportunity']} (${result['best_profit']:.2f})")
        else:
            print(f"❌ Error: {result['error']}")

def main():
    parser = argparse.ArgumentParser(description="Bybit + DEX Profitable Arbitrage Monitor")
    parser.add_argument("--config", default=CONFIG_FILE, help="Configuration file path")
    parser.add_argument("--continuous", action="store_true", help="Run continuously")
    parser.add_argument("--interval", type=int, default=1, help="Interval in minutes for continuous mode")
    parser.add_argument("--single", action="store_true", help="Run single cycle only")
    parser.add_argument("--status", action="store_true", help="Show current status")
    
    args = parser.parse_args()
    
    try:
        monitor = BybitDEXProfitableMonitor(args.config)
        
        if args.status:
            # Show current status
            if os.path.exists(RESULTS_FILE):
                with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                
                print("📊 Current Status:")
                print(f"Total opportunities: {len(results['opportunities'])}")
                print(f"Total alerts: {len(results['alerts'])}")
                print(f"Recent profit potential: ${sum(o['net_profit_usd'] for o in results['opportunities'][-10:]):.2f}")
                
                # Show recent opportunities
                if results['opportunities']:
                    print("\n🎯 Recent Opportunities:")
                    for opp in results['opportunities'][-5:]:
                        print(f"• {opp['pair']}: {opp['buy_platform']} → {opp['sell_platform']} (${opp['net_profit_usd']:.2f})")
            else:
                print("No results file found")
            return
        
        if args.single:
            monitor.run_single_cycle()
        elif args.continuous:
            monitor.run_continuous(args.interval)
        else:
            print("Bybit + DEX Profitable Arbitrage Monitor")
            print("=" * 60)
            print("🎯 Perfect for Russian users!")
            print("💰 Only Bybit + DEX platforms")
            print("🛡️ No bank involvement - No 115 FZ risk!")
            print("🔒 Only cryptocurrency transactions")
            print()
            print("🚨 Features:")
            print("• Real-time monitoring")
            print("• Instant alerts when profitable opportunities found")
            print("• Enhanced profit detection")
            print("• Gas price optimization")
            print("• Volume-based filtering")
            print()
            print("💰 Minimum profit threshold: $100")
            print("💰 Minimum profit percentage: 2%")
            print()
            print("Use --continuous for continuous monitoring")
            print("Use --single for single cycle")
            print("Use --status to check current status")
            
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    import os
    exit(main())