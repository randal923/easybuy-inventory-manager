import { Injectable } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

@Injectable()
export class HttpService {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await axios.get<T>(url, config)
      return response
    } catch (error) {
      throw error
    }
  }

  async post<T, R = T>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<R>> {
    try {
      const response = await axios.post<R>(url, data, config)
      return response
    } catch (error) {
      throw error
    }
  }

  async fetchAllBoaGestaoPages<T>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<T[]> {
    try {
      let page = 1
      let allResults: T[] = []
      let fetchNextPage = true

      while (fetchNextPage) {
        const response = await axios.get<{
          page: number
          pagecount: number
          rows: T[]
        }>(`${url}?page=${page}`, config)
        allResults = allResults.concat(response.data.rows)

        if (page < response.data.pagecount) {
          page++
        } else {
          fetchNextPage = false
        }
      }

      return allResults
    } catch (error) {
      throw error
    }
  }
}
