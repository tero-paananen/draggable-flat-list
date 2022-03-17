# Example applications with draggable FlatList for Windows, iOS and Android

React Native FlatList component whose items can be drag into new positions. This component **does NOT use** [React Native Reanimated](https://github.com/software-mansion/react-native-reanimated) or [React Native Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler) and that is why this works also on React Native Windows.

Tested on platforms: Windows, iOS, Android

Not tested in production.

---

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
- `renderItem` function `({item, drag})` for rendering your item into FlatList. Call `drag` to start item dragging
- `onHandleMove` called when item is moved into new position. New `items` data is as argument.
- `flyingItemStyle` style for item that is under dragging and is flying on FlatList

## Usage

```
const App = () => {
  const [data, setData] = useState<MyItem[]>(INITIAL_DATA);

  // Item move done and new item array received
  const handleMove = useCallback(
    (fromIndex: number, toIndex: number, items: Item[]) => {
      setData(items);
    },
    [],
  );

  // Your custom FlatList item
  const MyListItem = React.memo(
    ({item, drag}: {item: MyItem; drag?: (id: string) => void}) => {
      // Long press fires 'drag' to start item dragging
      const handleLongPress = useCallback(() => {
        drag && drag(item.id);
      }, [drag, item.id]);
      return (
        <TouchableOpacity
          onLongPress={handleLongPress}
          style={styles.itemContainer}
          key={item.id}>
          <Text style={[styles.item, {height: item.height}]}>{item.title}</Text>
        </TouchableOpacity>
      );
    },
  );
  const renderItem = useCallback(
    ({item, drag}: {item: MyItem; drag?: (id: string) => void}) => {
      return <MyListItem item={item} drag={drag} />;
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
        onHandleMove={handleMove}
        flyingItemStyle={styles.flying}
      />
      <View style={styles.footer} />
    </View>
  );
};

```

## Videos

https://user-images.githubusercontent.com/54746036/157134252-e8f17a63-d3cc-41ba-a054-46bc6bb97c3c.mov

https://user-images.githubusercontent.com/54746036/158036442-191a4982-21a6-4a76-ab2d-10c064cd4aed.mov
