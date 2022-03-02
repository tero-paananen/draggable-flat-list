import {Item} from './DraggableFlatList';
import {FlatListItem} from './DraggableFlatList';
import React, {useMemo, useCallback, useRef} from 'react';
import {View, TouchableWithoutFeedback} from 'react-native';

const DraggableItem = ({
  itemData,
  onSelected,
  children,
  below,
  setRef,
}: {
  itemData: FlatListItem;
  onSelected: (item: Item) => void;
  children?: JSX.Element;
  below?: string;
  setRef: (ref: React.RefObject<View>) => void;
}) => {
  const {item} = itemData;
  const isBelow = item.id === below;
  const itemRef = useRef<View>(null);

  const handleSelected = useCallback(() => {
    onSelected(item);
  }, [item, onSelected]);

  const handleLayout = useCallback(() => {
    setRef(itemRef); // only get reference into item
  }, [setRef]);

  const style = useMemo(() => {
    const color = isBelow ? '#ededed' : 'transparent';
    return {...{backgroundColor: color}, ...{height: item.height}};
  }, [isBelow, item.height]);

  return (
    <TouchableWithoutFeedback onPress={handleSelected}>
      <View style={style} ref={itemRef} onLayout={handleLayout}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default DraggableItem;
