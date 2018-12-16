interface DepItem {
  name: string
  count: number
}

export default class DepSet {
  private _list: DepItem[] = []
  public checked: boolean = false

  public get(name: string) {
    return this._list.find(item => item.name === name)
  }

  public add(name: string, count: number = 1) {
    const item = this.get(name)
    if (item) {
      item.count += count
    } else {
      this._list.push({ name, count })
    }
  }

  public count(name: string) {
    const item = this.get(name)
    return item ? item.count : 0
  }

  public each(callback: (name: string, count: number, index: number) => void) {
    this._list.forEach((item, index) => {
      callback(item.name, item.count, index)
    })
  }
}
