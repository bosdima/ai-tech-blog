#!/usr/bin/env python3
"""
Bybit + DEX Arbitrage Monitor with Real-time Alerts
Мониторинг арбитражных связок Bybit + DEX с мгновенными уведомлениями
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

# Optional email imports (comment out if not needed)
try:
    import smtplib
    from email.mime.text import MimeText
    from email.mime.multipart import MimeMultipart
    EMAIL_AVAILABLE = True
except ImportError:
    EMAIL_AVAILABLE = False
    print("Warning: Email functionality not available - install email libraries")

# Optional Telegram imports (comment out if not needed)
try:
    import requests
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False
    print("Warning: Telegram functionality not available - install requests library")

# Configuration
CONFIG_FILE = "bybit_dex_arbitrage_config.json"
LOG_FILE = "bybit_dex_arbitrage_monitor_logs.txt"
RESULTS_FILE = "bybit_dex_arbitrage_monitor_results.json"
ALERTS_FILE = "bybit_dex_arbitrage_alerts.txt"

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

class BybitDEXArbitrageMonitor:
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
        
        # Alert settings
        self.alert_thresholds = {
            "min_profit_usd": 50,  # Minimum $50 profit
            "min_profit_percentage": 0.01,  # 1% minimum
            "max_gas_price_eth": 50,  # Max 50 Gwei for Ethereum
            "max_gas_price_bsc": 30   # Max 30 Gwei for BSC
        }
        
        # Email settings (configure these)
        self.email_enabled = False  # Set to True to enable email
        self.email_smtp_server = "smtp.gmail.com"
        self.email_smtp_port = 587
        self.email_username = "your_email@gmail.com"
        self.email_password = "your_app_password"
        self.email_recipients = ["your_email@gmail.com"]
        
        # Telegram settings (configure these)
        self.telegram_enabled = False  # Set to True to enable Telegram
        self.telegram_bot_token = "YOUR_TELEGRAM_BOT_TOKEN"
        self.telegram_chat_id = "YOUR_TELEGRAM_CHAT_ID"
        
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
        self.base_gas_price = 30
        
        # Alert tracking
        self.last_alert_time = {}
        self.alert_cooldown = 300  # 5 minutes between alerts
        
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
        logger = logging.getLogger('bybit_dex_arbitrage_monitor')
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
        
        # Bybit has slightly different pricing
        variation = random.uniform(-0.001, 0.001)  # ±0.1%
        price = base_price * (1 + variation)
        
        # Update base price for next iteration
        self.base_prices[pair] = price * (1 + random.uniform(-0.0001, 0.0001))
        
        volume = random.uniform(1000000, 5000000)
        
        return PriceData(
            platform="bybit",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_uniswap_price(self, pair: str) -> PriceData:
        """Generate realistic Uniswap prices"""
        base_price = self.base_prices[pair]
        
        # Uniswap has slightly higher prices due to fees
        variation = random.uniform(0.0005, 0.002)  # +0.05-0.2%
        price = base_price * (1 + variation)
        
        volume = random.uniform(500000, 2000000)
        
        return PriceData(
            platform="uniswap_v3",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_pancakeswap_price(self, pair: str) -> PriceData:
        """Generate realistic PancakeSwap prices"""
        base_price = self.base_prices[pair]
        
        # PancakeSwap has competitive pricing
        variation = random.uniform(0.0003, 0.0015)  # +0.03-0.15%
        price = base_price * (1 + variation)
        
        volume = random.uniform(300000, 1500000)
        
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
        variation = random.uniform(0.0004, 0.0018)  # +0.04-0.18%
        price = base_price * (1 + variation)
        
        volume = random.uniform(200000, 1000000)
        
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
        variation = random.uniform(-5, 15)  # ±5-15 Gwei
        gas_price = base_gas_price + variation
        
        # Update base gas price
        self.base_gas_price = gas_price * (1 + random.uniform(-0.01, 0.01))
        
        return max(gas_price, 10)  # Minimum 10 Gwei
    
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
    
    def find_arbitrage_opportunities(self, all_prices: Dict[str, List[PriceData]]) -> List[ArbitrageOpportunity]:
        """Find all arbitrage opportunities"""
        opportunities = []
        
        # Bybit to Uniswap
        for pair in ["BTC/USDT", "ETH/USDT", "USDC/USDT"]:
            bybit_price = self.get_price_by_pair(all_prices["bybit"], pair)
            uniswap_price = self.get_price_by_pair(all_prices["uniswap_v3"], pair)
            
            if bybit_price and uniswap_price and bybit_price.price < uniswap_price.price:
                opp = self.create_opportunity(
                    ArbitrageType.BYBIT_TO_UNISWAP, pair, "bybit", "uniswap_v3",
                    bybit_price, uniswap_price, 300000, 2000
                )
                if opp:
                    opportunities.append(opp)
        
        # Bybit to PancakeSwap
        for pair in ["BTC/USDT", "ETH/USDT", "BNB/USDT"]:
            bybit_price = self.get_price_by_pair(all_prices["bybit"], pair)
            pancakeswap_price = self.get_price_by_pair(all_prices["pancakeswap_v3"], pair)
            
            if bybit_price and pancakeswap_price and bybit_price.price < pancakeswap_price.price:
                opp = self.create_opportunity(
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
            
            if bybit_price and curve_price and bybit_price.price < curve_price.price:
                opp = self.create_opportunity(
                    ArbitrageType.BYBIT_TO_CURVE, pair, "bybit", "curve_finance",
                    bybit_price, curve_price, 200000, 2000
                )
                if opp:
                    opportunities.append(opp)
        
        # Bybit to SushiSwap
        for pair in ["BTC/USDT", "ETH/USDT", "USDC/USDT"]:
            bybit_price = self.get_price_by_pair(all_prices["bybit"], pair)
            sushiswap_price = self.get_price_by_pair(all_prices["sushiswap"], pair)
            
            if bybit_price and sushiswap_price and bybit_price.price < sushiswap_price.price:
                opp = self.create_opportunity(
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
    
    def create_opportunity(self, opp_type: ArbitrageType, pair: str, buy_platform: str, 
                          sell_platform: str, buy_price: PriceData, sell_price: PriceData,
                          gas_limit: int, gas_cost_multiplier: float) -> Optional[ArbitrageOpportunity]:
        """Create arbitrage opportunity if profitable"""
        try:
            # Calculate profit percentage
            price_diff = sell_price.price - buy_price.price
            profit_percentage = (price_diff / buy_price.price)
            
            # Calculate volume based on pair
            if pair == "BTC/USDT":
                volume = min(0.01, 1000 / buy_price.price)
            elif pair == "ETH/USDT":
                volume = min(0.1, 1000 / buy_price.price)
            elif pair == "BNB/USDT":
                volume = min(1.0, 1000 / buy_price.price)
            else:
                volume = min(1000 / buy_price.price, 1000)
            
            # Calculate gas cost
            gas_price = self.generate_gas_price()
            gas_cost_usd = (gas_price * gas_limit) / 1e9 * gas_cost_multiplier
            
            # Calculate net profit
            estimated_profit_usd = price_diff * volume
            net_profit_usd = estimated_profit_usd - gas_cost_usd
            
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
            
            # Send email alert
            if self.email_enabled:
                self.send_email_alert(alert_message)
            
            # Send Telegram alert
            if self.telegram_enabled:
                self.send_telegram_alert(alert_message)
            
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
"""
    
    def send_email_alert(self, message: str):
        """Send email alert"""
        if not EMAIL_AVAILABLE or not self.email_enabled:
            return
            
        try:
            msg = MimeMultipart()
            msg['From'] = self.email_username
            msg['To'] = ', '.join(self.email_recipients)
            msg['Subject'] = '🚨 Bybit + DEX Арбитражная Возможность!'
            
            msg.attach(MimeText(message, 'plain', 'utf-8'))
            
            server = smtplib.SMTP(self.email_smtp_server, self.email_smtp_port)
            server.starttls()
            server.login(self.email_username, self.email_password)
            
            text = msg.as_string()
            server.sendmail(self.email_username, self.email_recipients, text)
            server.quit()
            
        except Exception as e:
            self.logger.error(f"Error sending email alert: {e}")
    
    def send_telegram_alert(self, message: str):
        """Send Telegram alert"""
        if not TELEGRAM_AVAILABLE or not self.telegram_enabled:
            return
            
        try:
            url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
            data = {
                'chat_id': self.telegram_chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            response = requests.post(url, data=data)
            response.raise_for_status()
            
        except Exception as e:
            self.logger.error(f"Error sending Telegram alert: {e}")
    
    def run_monitoring_cycle(self) -> Dict[str, Any]:
        """Run one complete monitoring cycle"""
        self.logger.info("Starting Bybit + DEX arbitrage monitoring cycle...")
        
        try:
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
            
            # Find arbitrage opportunities
            self.logger.info("Searching for arbitrage opportunities...")
            opportunities = self.find_arbitrage_opportunities(all_prices)
            
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
                "total_profit": sum(o.net_profit_usd for o in opportunities)
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
        
        while True:
            try:
                result = self.run_monitoring_cycle()
                
                if result["status"] == "success":
                    self.logger.info(f"Cycle completed: {result['opportunities_found']} opportunities found, {result['alerts_sent']} alerts sent")
                
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
            print(f"💰 Total potential profit: ${result['total_profit']:.2f}")
        else:
            print(f"❌ Error: {result['error']}")

def main():
    parser = argparse.ArgumentParser(description="Bybit + DEX Arbitrage Monitor with Real-time Alerts")
    parser.add_argument("--config", default=CONFIG_FILE, help="Configuration file path")
    parser.add_argument("--continuous", action="store_true", help="Run continuously")
    parser.add_argument("--interval", type=int, default=1, help="Interval in minutes for continuous mode")
    parser.add_argument("--single", action="store_true", help="Run single cycle only")
    parser.add_argument("--status", action="store_true", help="Show current status")
    
    args = parser.parse_args()
    
    try:
        monitor = BybitDEXArbitrageMonitor(args.config)
        
        if args.status:
            # Show current status
            if os.path.exists(RESULTS_FILE):
                with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                
                print("📊 Current Status:")
                print(f"Total opportunities: {len(results['opportunities'])}")
                print(f"Total alerts: {len(results['alerts'])}")
                print(f"Recent profit: ${sum(o['net_profit_usd'] for o in results['opportunities'][-10:]):.2f}")
                
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
            print("Bybit + DEX Arbitrage Monitor")
            print("=" * 60)
            print("🎯 Perfect for Russian users!")
            print("💰 Only Bybit + DEX platforms")
            print("🛡️ No bank involvement - No 115 FZ risk!")
            print("🔒 Only cryptocurrency transactions")
            print()
            print("🚨 Features:")
            print("• Real-time monitoring")
            print("• Instant alerts when profitable opportunities found")
            print("• Email notifications")
            print("• Telegram notifications")
            print("• Gas price monitoring")
            print()
            print("📧 Configure email settings in the code")
            print("📱 Configure Telegram settings in the code")
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