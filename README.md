# draggable-flat-list

React Native FlatList component whose items can be drag into new positions. This component **does NOT use** [React Native Reanimated](https://github.com/software-mansion/react-native-reanimated) or [React Native Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler) and that is why this works also on React Native Windows.

[Version 0.0.1](https://github.com/tero-paananen/draggable-flat-list/blob/0.0.1/README.md) is tested on platforms: Windows, iOS, Android

Not tested in production.

---

## Development env

```
"typescript": "^4.5.5"
"react": "17.0.2",
"react-native": "^0.65.0",
"react-native-windows": "0.65.8"
```

## Usage

```
const App = () => {
  const [data, setData] = useState<MyItem[]>(INITIAL_DATA);
  const [selected, setSelected] = useState<Item | undefined>(undefined);

  // Handle item data update on move
  const handleMove = useCallback(
    (fromIndex: number, toIndex: number, items: Item[]) => {
      console.log('handleMove ', {fromIndex, toIndex});
      const newData = arrayMoveImmutable(items, fromIndex, toIndex);
      setSelected(undefined);
      setData(newData);
    },
    [],
  );

  // Make your custom item for FlatList
  const MyListItem = React.memo(({item}: {item: MyItem}) => {
    const handleSelected = useCallback(() => {
      console.log('selected', {item});
      item.id === selected?.id ? setSelected(undefined) : setSelected(item);
    }, [item]);
    const backgroundColor = item.id === selected?.id ? 'lightgray' : undefined;
    return (
      <TouchableOpacity
        onPress={handleSelected}
        style={[styles.itemContainer, {backgroundColor}]}
        key={item.id}>
        <Text style={[styles.item, {height: item.height}]}>{item.title}</Text>
      </TouchableOpacity>
    );
  });

  const renderItem = useCallback(({item}: {item: MyItem}) => {
    return <MyListItem item={item} />;
  }, [selected]);

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <DraggableFlatList
        style={styles.list}
        data={data}
        selected={selected}
        renderItem={renderItem}
        onHandleMove={handleMove}
      />
      <View style={styles.footer} />
    </View>
  );
};

```

https://user-images.githubusercontent.com/54746036/156192827-a4fc87cd-32c1-41f9-bfa8-b199f69bb0d2.mov

![win](https://user-images.githubusercontent.com/54746036/156190545-1d8509ed-6ba7-4d36-a8a4-89fd1b0e4d12.jpg)
