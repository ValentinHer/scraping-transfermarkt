import puppeteer from "puppeteer";
import fs from "fs";
import { Parser } from "json2csv";
import XLSX from "xlsx";

export async function getDataFromTransfermarkt() {
  try {
    const navegador = await puppeteer.launch({
      headless: false,
      slowMo: 400,
    });

    const pagina = await navegador.newPage();
    //Navegar a la página principal de transfermarkt
    await pagina.goto("https://www.transfermarkt.es/", {
      waitUntil: "networkidle2",
    });

    //Esperar a que el campo de búsqueda este disponible
    await pagina.waitForSelector(".tm-header__input--search-field", {
      timeout: 60000,
    });
    //Ingresar elemento a buscar dinámicamentes
    await pagina.locator(".tm-header__input--search-field").fill("liga mexicana");

    //Hacer clic en el botón de búsqueda
    // y esperar a que los resultados se carguen
    await pagina.locator(".tm-header__input--search-send").click();

    await pagina.waitForSelector("#yw0", {
        timeout: 60000
    });

    const enlacesClubs = await pagina.evaluate(() => {
      const clubsArray = [];
      const clubs = document
        .querySelectorAll("#yw0>table.items>tbody>tr")
        .forEach((club) => clubsArray.push(club));

      //Regresa el enlace de cada equipo
      return clubsArray.map((club) => {
        const enlaceClub =
          club.querySelector("td>a")?.href ?? "No Disponible";

        return enlaceClub;
      });
    });

    navegador.close();
    console.log(enlacesClubs);


    //Sacar informacion de cada club
    const resultadosClub = [];
    for (let i = 0; i < 1; i++) {
      const navegador = await puppeteer.launch({
        headless: false,
        slowMo: 400,
      });

      const pagina = await navegador.newPage();
      //Navegar a la página del club
      await pagina.goto(enlacesClubs[i], {
        waitUntil: "networkidle2",
        timeout: 60000
      });

      const datos = await pagina.evaluate(async() => {

        //INFORMACIÓN LIGA
        const nombreLiga = document.querySelector(".data-header__headline-container>h1")?.innerText.trim() || "No Disponible";
        const imagenLiga = document.querySelector(".data-header__profile-container>img")?.currentSrc.trim() || "No Disponible";
        const cantidadEquipos = document.querySelector(".data-header__items:first-child>li:first-child>span")?.innerText.trim() || "No Disponible";
        const cantidadJugadores = document.querySelector(".data-header__items:first-child>li:nth-child(2)>span")?.innerText.trim() || "No Disponible";
        const cantidadJugadoresExtranjeros = document.querySelector(".data-header__items:first-child>li:nth-child(3)>span>a")?.innerText.trim() || "No Disponible";
        const porcentajeJugadoresExtranjeros = document.querySelector(".data-header__items:first-child>li:nth-child(3)>span>span")?.innerText.trim() || "No Disponilbe";
        const valorEnElMercado = document.querySelector(".data-header__items:nth-child(2)>li:first-child>span")?.innerText.trim() || "No Disponible";
        const anios = document.querySelector(".data-header__items:nth-child(2)>li:nth-child(2)>span")?.innerText || "No Disponible";
        const jugadorMasValioso = document.querySelector(".data-header__items:nth-child(2)>li:nth-child(3)>span>a")?.innerText.split(" ")[0]?.trim() || "No Disponible";
        const precioJugadorMasValioso = document.querySelector(".data-header__items:nth-child(2)>li:nth-child(3)>span>span")?.innerText.split(" ")[0]?.trim() || "No Disponible";
        const valorTotalEnElMercado = document.querySelector(".data-header__box--small>a")?.innerText.split("\n")[0]?.trim() || "No Disponible";

        //Información de liga del equipo
        const nombreLigaNacional = document.querySelector(".data-header__club-info>span:first-child>a")?.innerText.trim() || "No Disponible";
        const imagenLigaNacional = document.querySelector(".data-header__box__club-link>img")?.currentSrc.trim() || "No Disponible";
        const nivelLiga = document.querySelector(".data-header__club-info>span:nth-child(2)>span")?.innerText.trim() || "No Disponible";
        const actualCampeon = document.querySelector(".data-header__club-info>span:nth-child(3)>span>a")?.innerText.trim() || "No Disponible";
        const campeonRecord = document.querySelector(".data-header__club-info>span:nth-child(4)>span>a")?.innerText.split(" ")[0]?.trim() || "No Disponible";

        //Información de cada equipo
        const datosEquipo = () => {
            const equiposArray = [];
            const jugadores = document.querySelectorAll("#yw1>table.items>tbody>tr").forEach(equipo => equiposArray.push(equipo));

            return equiposArray.map(equipo => {
                // const numero = equipo.querySelector("td:first-child>div.rn_nummer").innerText.trim() || "No Disponible";
                const imagenEquipo = equipo.querySelector("td:first-child>a>img")?.currentSrc.trim() || "No Disponible";
                const nombreEquipo = equipo.querySelector("td:nth-child(2)>a")?.innerText.trim() || "No Disponible";
                const enlaceEquipo = equipo.querySelector("td:nth-child(2)>a")?.href.trim() || "No Disponible";
                // const posicionJugador = equipo.querySelector("td:nth-child(2)>table>tbody>tr:nth-child(2)>td").innerText.trim() || "No Disponible";
                // const fechaNacimiento = equipo.querySelector("td:nth-child(3)").innerText.trim() || "No Disponible";
                // const nacionalidadJugador = equipo.querySelector("td:nth-child(4)>img").title.trim() || "No Disponible";
                // const valorEnMercado = equipo.querySelector("td:nth-child(5)>a").innerText.trim() || "No Disponible";


                return {
                    imagenEquipo,
                    nombreEquipo,
                    enlaceEquipo,
                }
        })
        }

        const datosEquipos = datosEquipo();

        return {
          nombreLiga,
          imagenLiga,
          cantidadEquipos,
          cantidadJugadores,
          cantidadJugadoresExtranjeros,
          porcentajeJugadoresExtranjeros,
          valorEnElMercado,
          anios,
          jugadorMasValioso,
          precioJugadorMasValioso,
          valorEnElMercado,
          valorTotalEnElMercado,
          "liga nacional": {
            nombreLigaNacional,
            imagenLigaNacional,
            nivelLiga,
            actualCampeon,
            campeonRecord
          },
          "equipos": datosEquipos
        }
      })

      navegador.close();

      resultadosClub.push(datos);
    }


    //Sacar información de cada equipo
    for (let i = 0; i < resultadosClub[0].equipos.length; i++) {
        const navegador = await puppeteer.launch({
        headless: false,
        slowMo: 400,
      });

      const pagina = await navegador.newPage();
      //Navegar a la página del equipo
      await pagina.goto(resultadosClub[0].equipos[i].enlaceEquipo, {
        waitUntil: "networkidle2",
        timeout: 100000
      });

      const datosForEquipo = await pagina.evaluate(async() => {
        //Información del equipo
        const nombreClub = document.querySelector(".data-header__headline-container>h1")?.innerText.trim() || "No Disponible";
        const imagenClub = document.querySelector(".data-header__profile-container>img")?.currentSrc.trim() || "No Disponible";
        const cantidadJugadores = document.querySelector(".data-header__items:first-child>li:first-child>span")?.innerText.trim() || "No Disponible";
        const edadPromedioJugador = document.querySelector(".data-header__items:first-child>li:nth-child(2)>span")?.innerText.trim() || "No Disponible";
        const cantidadJugadoresExtranjeros = document.querySelector(".data-header__items:first-child>li:nth-child(3)>span>a")?.innerText.trim() || "No Disponible";
        const porcentajeJugadoresExtranjeros = document.querySelector(".data-header__items:first-child>li:nth-child(3)>span>span")?.innerText.trim() || "No Disponilbe";
        const cantidadJugadoresEquipoNacional = document.querySelector(".data-header__items:nth-child(2)>li:first-child>span>a")?.innerText.trim() || "No Disponible";
        const nombreEstadio = document.querySelector(".data-header__items:nth-child(2)>li:nth-child(2)>span>a")?.innerText || "No Disponible";
        const cantidadAsientosEstadio = document.querySelector(".data-header__items:nth-child(2)>li:nth-child(2)>span>span")?.innerText.split(" ")[0]?.trim() || "No Disponible";
        const recordTranferenciaActual = document.querySelector(".data-header__items:nth-child(2)>li:nth-child(3)>span>span>a")?.innerText.split("-")[1]?.trim() || "No Disponible";
        const valorEnElMercado = document.querySelector(".data-header__box--small>a")?.innerText.split("\n")[0]?.trim() || "No Disponible";


        //Información de jugadores del equipo
        const datosJugadores = () => {
            const jugadoresArray = [];
            const jugadores = document.querySelectorAll("#yw1>table.items>tbody>tr").forEach(jugador => jugadoresArray.push(jugador));

            return jugadoresArray.map(jugador => {
                const numero = jugador.querySelector("td:first-child>div.rn_nummer")?.innerText.trim() || "No Disponible";
                const imagenJugador = jugador.querySelector("td:nth-child(2)>table>tbody>tr:first-child>td:first-child>img")?.getAttribute("data-src")?.trim() || "No Disponible";
                const nombreJugador = jugador.querySelector("td:nth-child(2)>table>tbody>tr:first-child>td:nth-child(2)>a")?.innerText.trim() || "No Disponible";
                const posicionJugador = jugador.querySelector("td:nth-child(2)>table>tbody>tr:nth-child(2)>td")?.innerText.trim() || "No Disponible";
                const fechaNacimiento = jugador.querySelector("td:nth-child(3)")?.innerText.trim() || "No Disponible";

                const nacionalidades = [];

                const nacionalidadesJugador = jugador.querySelectorAll("td:nth-child(4)>img").forEach(nacion => {
                  nacionalidades.push(nacion);
                })

                const nacionalidadesDelJugador = nacionalidades.map(nacion => nacion?.title.trim());
                // const nacionalidadJugador = jugador.querySelector("td:nth-child(4)>img").title.trim() || "No Disponible";
                const valorEnMercado = jugador.querySelector("td:nth-child(5)>a")?.innerText.trim() || "No Disponible";


                return {
                    numero,
                    imagenJugador,
                    nombreJugador,
                    posicionJugador,
                    fechaNacimiento,
                    nacionalidadesDelJugador,
                    valorEnMercado
                }
            })
        };

        const dataJugadores = datosJugadores();

        return {
            nombreClub,
            imagenClub,
            cantidadJugadores,
            edadPromedioJugador,
            "jugadoresExtranjeros": {
                cantidadJugadoresExtranjeros,
                porcentajeJugadoresExtranjeros
            },
            cantidadJugadoresEquipoNacional,
            "estadio": {
                nombreEstadio,
                cantidadAsientosEstadio
            },
            recordTranferenciaActual,
            valorEnElMercado,
            "jugadores": dataJugadores
        }
      });

      navegador.close();
      
      resultadosClub[0].equipos[i]["informacion"] = datosForEquipo;

      console.log(datosForEquipo);
      await new Promise(resolve => setTimeout(resolve, 10000)); // espera 10 segundos
    }

    console.log(resultadosClub);

    //crear archivo JSON
    const data = JSON.stringify(resultadosClub);
    fs.writeFileSync("resultadosClubs.json", data);

    console.log(":::Archivo JSON CREADO!!:::");

    let dataJugadoresArray = []

    const dataJugadores = resultadosClub.map(item => {
      return item.equipos.map(equipo => {
        return equipo.informacion.jugadores.map(jugador => dataJugadoresArray.push(jugador))
      })
    })

      //Crear archivo CSV
  const fields = ["numero", "imagenJugador", "nombreJugador", "posicionJugador", "nacionalidadesDelJugador"];
  const json2csvParse = new Parser({
    fields,
    defaultValue: "No hay Información",
  });
  const csv = json2csvParse.parse(dataJugadoresArray);
  fs.writeFileSync("resultadosClub.csv", csv, "utf-8");
  console.log("Archivo CSV creado!!!");

  //Crear archivo XLSX
  const worksheet = XLSX.utils.json_to_sheet(dataJugadoresArray);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos Jugadores");
  XLSX.writeFile(workbook, "resultadosClub.xlsx");

  console.log("Archivo XLSX creado!!!");


    return {"datos": resultadosClub, "success": true};

  } catch (error) {
    console.log(":::Error al buscar: ", error.message);
    console.log(error);
    return {"success": false};
  }
}

getDataFromTransfermarkt()
