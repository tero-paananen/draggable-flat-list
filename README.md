# Example applications with draggable FlatList for Windows, iOS and Android

React Native FlatList component whose items can be drag into new positions. This component **does NOT use** [React Native Reanimated](https://github.com/software-mansion/react-native-reanimated) or [React Native Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler) and that is why this works also on React Native Windows.

Tested on platforms: Windows, iOS, Web, (not yet Android)

Not tested in production.


## How to use

Currently you have to copy files `DraggableFlatList.tsx` and `DraggableItem.tsx` into your typescript project. This repo is mainly example application project that contains these components.

## Development env

```
"typescript": "^4.5.5"
"react": "17.0.2",
"react-native": "^0.65.0",
"react-native-windows": "0.65.8"
```

## DraggableFlatList API

- `mode` Two different item drop position indicators. `default` shows position using background color below target item or `expands` that expands other items to show where item will be dropped
- `style` container view style of FlatList
- `data` items for FlatList these have to implement `Item` type
- `renderItem` function `({item, move})` for rendering your item into FlatList. Call `move` to start item dragging
- `onMoveEnd` called when item is moved into new position. New `items` data is as argument.
- `flyingItemStyle` style for item that is under dragging and is flying on FlatList

## Usage

```
type MyItem = DraggableFlatListItem & {
  title?: string;
};

const App = () => {
  const [data, setData] = useState<MyItem[]>(INITIAL_DATA);

  // Item move done and new item array received
   const handleMove = useCallback(
    ({ items }: { items: DraggableFlatListItem[] }) => {
      setData(items);
    },
    []
  );

  // Your custom FlatList item
  const MyListItem = React.memo(
    ({ item, move }: { item: MyItem; move: (key: string) => void }) => {
      // Long press fires 'move' to start item dragging
      const handleLongPress = useCallback(() => {
        move(item.key);
      }, [move, item.key]);
      return (
        <TouchableOpacity
          onLongPress={handleLongPress}
          style={styles.itemContainer}
          key={item.key}>
          <Text style={styles.item}>{item.title}</Text>
        </TouchableOpacity>
      );
    },
  );
  const renderItem = useCallback(
    ({ item, move }: { item: MyItem; move: (key: string) => void }) => {
      return <MyListItem item={item} move={move} />;
    },
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <DraggableFlatList
        mode={'expands'} // default or expands
        style={styles.list}
        data={data}
        renderItem={renderItem}
        onMoveEnd={handleMoveEnd}
        itemHeight={50}
        flyingItemStyle={styles.flying}
      />
      <View style={styles.footer} />
    </View>
  );
};

```

## Videos

https://user-images.githubusercontent.com/54746036/166445251-d06e347b-c46d-4669-96e3-fac516379778.mov




