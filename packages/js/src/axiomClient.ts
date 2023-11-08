import { Axiom } from "./client"
import { ClientOptions } from "./httpClient"
import { Logger, LoggerConfig } from "./logger"
import { applyMixins } from "./mixin"


interface AxiomClient extends Logger, Axiom {}

class AxiomClient {
  constructor(props: LoggerConfig  & ClientOptions){
    Logger.call(this, props)
    Axiom.call(this, props)
  }
}

applyMixins(AxiomClient, [Logger, Axiom])

export { AxiomClient }


