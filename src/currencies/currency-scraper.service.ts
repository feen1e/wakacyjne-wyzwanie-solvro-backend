import { load } from "cheerio";
import puppeteer, { Browser } from "puppeteer";

import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { ISO_CODES } from "../validators/is-valid-currency-code.validator";
import { CurrenciesService } from "./currencies.service";

@Injectable()
export class CurrencyScraperService {
  constructor(private readonly currencyService: CurrenciesService) {}
  private readonly logger = new Logger(CurrencyScraperService.name);

  @Cron("0 */5 * * * *", {
    disabled: process.env.NODE_ENV === "test",
  })
  async handleCron() {
    await this.scrapeRates();
  }

  async scrapeRates() {
    const browser: Browser = await puppeteer.launch({ headless: true });
    const rates: Record<string, number> = {};
    const page = await browser.newPage();

    await page.goto("https://www.walutomat.pl/kursy-walut/", {
      waitUntil: "networkidle2",
    });

    const $ = load(await page.content());
    //this.logger.log($.html());

    const rows = $(
      "section.rates-table-container a.rates-table__row",
    ).toArray();

    for (const element of rows) {
      const codeText = $(element)
        .find("p.rates-table__exchange-rate")
        .text()
        .trim();
      const codePair = codeText.split(" / ")[0].replaceAll(/\s/g, "").trim();
      if (!codePair.includes("/PLN")) {
        continue;
      }
      const currency = codePair.split("/")[0].trim();
      const rateText = $(element)
        .find("span.single-rate-element__current-rate_value")
        .first()
        .text()
        .trim();
      const rate = Number.parseFloat(rateText.replace(",", "."));

      //this.logger.log(`Extracted: Currency="${currency}", Rate="${rateText}" -> ${rate.toString()}`);

      if (ISO_CODES.has(currency.toUpperCase())) {
        rates[currency.toUpperCase()] = rate;
        await this.currencyService.upsertCurrency(currency.toUpperCase(), rate);
      } else {
        //this.logger.warn(`Skipped invalid currency or rate: ${currency} - ${rate.toString()}`);
      }
    }
    this.logger.log(`Scraped rates: ${JSON.stringify(rates)}`);
    await browser.close();
    return rates;
  }

  // async scrapeRates(): Promise<Record<string, number>> {
  //     const url = "https://www.walutomat.pl/kursy-walut/";
  //     const rates: Record<string, number> = {};

  //     let browser: Browser | undefined;
  //     try {
  //         browser = await puppeteer.launch({ headless: true });
  //         const page = await browser.newPage();
  //         await page.goto(url, { waitUntil: 'networkidle2', timeout: 25_000});

  //         const html = await page.content();
  //         const $ = cheerio.load(html);
  //         // this.logger.log($.html()); // Commented out to reduce log verbosity

  //         const rows = $("section.rates-table-container a.rates-table__row").toArray();

  //         for (const element of rows) {
  //             try {
  //                 // this.logger.log($(element).html()); // Commented out to reduce log verbosity

  //                 // Extract currency code - take the first part before " / " and remove non-alphabetic characters
  //                 const currencyText = $(element).find("p.rates-table__exchange-rate").text().trim();
  //                 const currencyPair = currencyText.split(" / ")[0].replaceAll(/\s/g, "").trim();

  //                 // Only process currency pairs that are against PLN (e.g., EUR/PLN, USD/PLN)
  //                 if (!currencyPair.includes("/PLN")) {
  //                     continue;
  //                 }

  //                 // Extract just the first currency from pairs like "EUR/PLN" -> "EUR"
  //                 const currency = currencyPair.split("/")[0].trim();

  //                 // Get the "ask" rate (middle rate element) - this is the selling rate
  //                 const rateText = $(element).find("span.single-rate-element__current-rate_value").eq(1).text().trim();
  //                 const rate = Number.parseFloat(rateText.replaceAll(",", ".").replaceAll(/[^\d.,]/g, ""));

  //                 this.logger.log(`Extracted: Currency="${currency}", Rate="${rateText}" -> ${rate.toString()}`);

  //                 if (ISO_CODES.has(currency.toUpperCase()) && !Number.isNaN(rate)) {
  //                     rates[currency.toUpperCase()] = rate;

  //                     await this.currencyService.upsertCurrency(currency.toUpperCase(), rate)
  //                 } else {
  //                     this.logger.warn(`Skipped invalid currency or rate: ${currency} - ${rate.toString()}`);
  //                 }
  //             } catch (error) {
  //                 this.logger.error(`Error processing element: ${error instanceof Error ? error.message : String(error)}`);
  //                 throw new Error(`Error processing element: ${error instanceof Error ? error.message : String(error)}`);
  //             }
  //         }

  //         this.logger.log(`Scraped rates: ${JSON.stringify(rates)}`);
  //         return rates;
  //     } catch (error) {
  //         this.logger.error(`Failed to scrape exchange rates: ${error instanceof Error ? error.message : String(error)}`);
  //         throw new Error(`Failed to scrape exchange rates: ${error instanceof Error ? error.message : String(error)}`);
  //     } finally {
  //         if (browser !== undefined) {
  //             await browser.close();
  //         }
  //     }
  // }
}

// by nth child: section.container:nth-child(4) > div:nth-child(1) > div:nth-child(2) > a
// and: div:nth-child(3) > span:nth-child(2) > span:nth-child(1)

//section.rates-table-container a.rates-table__row
//p.rates-table__exchange-rate
//span.single-rate-element__current-rate_value

//section.container:nth-child(4) > div:nth-child(1) > div:nth-child(2) > a:nth-child(2) > p:nth-child(1)
///section.container:nth-child(4) > div:nth-child(1) > div:nth-child(2) > a:nth-child(2) > div:nth-child(3) > span:nth-child(2) > span:nth-child(1)
//section.container:nth-child(4) > div:nth-child(1) > div:nth-child(2) >| a:nth-child(3) > p:nth-child(1)
//section.container:nth-child(4) > div:nth-child(1) > div:nth-child(2) >| a:nth-child(4) > p:nth-child(1)
