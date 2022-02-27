import React, {useMemo, useState, useCallback, useRef} from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';

const CustomDraggableFlatList = ({
  data,
  renderItem,
  renderSelectedItem,
  style,
  onSelected,
  onHandleMove,
}) => {
  const [selected, setSelected] = useState(undefined);
  const [below, setBelow] = useState(undefined);
  const [layout, setLayout] = useState({layout: undefined});
  const [panning, setPanning] = useState(false);

  const selectedRef = useRef(undefined);
  const layoutRef = useRef(undefined);
  const previousOffsetY = useRef(0);
  const scrollOffsetY = useRef(0);
  const flatListRef = useRef(null);

  const scrollTimerRef = useRef(null);
  const moveStartPosYRef = useRef(-1);
  const moveCurrentPosYRef = useRef(-1);

  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = React.useRef(
    // https://reactnative.dev/docs/panresponder
    // https://eveningkid.medium.com/the-basics-of-react-native-gestures-23061b5e89cf
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => false,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => false,

      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (selectedRef.current) {
          // When user has done item selection we start capturing panning
          return true;
        }
        // User can scroll FlatList
        return false;
      },
      //onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {},

      onPanResponderMove: (event, gestureState) => {
        const {moveX, moveY} = gestureState;
        if (moveStartPosYRef.current === -1) {
          moveStartPosYRef.current = moveY - layoutRef.current.y;
        }
        moveCurrentPosYRef.current = moveY - layoutRef.current.y;
        pan.setValue({x: moveX, y: moveY});
        setPanning(true);
        if (isMovingEnought(moveY)) {
          !scrollTimerRef.current && handleScrollToPosition();
          showWhereToDrop(moveY);
        }
      },

      onPanResponderTerminationRequest: (evt, gestureState) => true,

      onPanResponderRelease: (evt, gestureState) => {
        const {moveY} = gestureState;
        const releasedOnItem = itemFromTouchPoint(moveY);
        handleMove(selectedRef.current, releasedOnItem);
        endPanning();
      },

      onPanResponderTerminate: (evt, gestureState) => {
        endPanning();
      },

      onShouldBlockNativeResponder: (evt, gestureState) => {
        return true;
      },
    }),
  ).current;

  const handleMove = (sourceItem, targetItem) => {
    if (sourceItem && targetItem) {
      const fromIndex = dataIndexFromItem(sourceItem);
      const toIndex = dataIndexFromItem(targetItem);
      onHandleMove(fromIndex, toIndex);
    }
  };

  const endPanning = () => {
    setSelected(undefined);
    setBelow(undefined);
    pan.setValue({x: 0, y: 0});
    setPanning(false);
    moveStartPosYRef.current = -1;
    moveCurrentPosYRef.current = -1;
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = false;
    }
  };

  const showWhereToDrop = moveY => {
    const item = itemFromTouchPoint(moveY);
    setBelow(item);
  };

  const itemFromTouchPoint = moveY => {
    let ret;
    const y = moveY - layoutRef.current.y + scrollOffsetY.current;
    const index = preparedData.findIndex(d => y > d.y && y < d.y + d.height);
    if (index !== -1) {
      ret = preparedData[index];
    }
    return ret;
  };

  const dataIndexFromItem = item => {
    if (item?.type === 'spacer') {
      return data.findIndex(d => d.id === item.itemId);
    } else {
      return data.findIndex(d => d.id === item.id);
    }
  };

  const isMovingEnought = moveY => {
    const TRESHOLD_PIXELS = 4;
    if (
      selectedRef.current &&
      layoutRef.current &&
      Math.abs(previousOffsetY.current - moveY) > TRESHOLD_PIXELS
    ) {
      previousOffsetY.current = moveY;
      return true;
    }
    return false;
  };

  const handleScrollToPosition = () => {
    // scroll flatlist to up or down
    if (scrollTimerRef.current) {
      return;
    }

    const cancelScrolling = () => {
      scrollTimerRef.current && clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    };

    const userScrollingUp =
      moveStartPosYRef.current > moveCurrentPosYRef.current; // user is panning up or down
    const tresholdTop = layoutRef.current.height * 0.1; // top view area for scrolling up
    const tresholdBottom = layoutRef.current.height * 0.9; // bottom view are for scrolling down
    if (
      moveCurrentPosYRef.current > tresholdTop &&
      moveCurrentPosYRef.current < tresholdBottom
    ) {
      cancelScrolling();
      return;
    }

    const offset = scrollOffsetY.current + (userScrollingUp ? -30 : 30); // amount of scrolling
    flatListRef.current?.scrollToOffset({offset, animated: true}); // scroll

    // scroll again after delayed if user is still panning into same direction
    scrollTimerRef.current = setTimeout(() => {
      scrollTimerRef.current = null;
      const userScrollingUpWhenTime =
        moveStartPosYRef.current > moveCurrentPosYRef.current;
      if (userScrollingUp === userScrollingUpWhenTime) {
        handleScrollToPosition();
      } else {
        cancelScrolling();
      }
    }, 24);
  };

  const preparedData = useMemo(() => {
    const ret = [];
    let y = 0;

    data.map((item, index) => {
      const itemHeight = item.height; // default item height
      let spacerHeight = 1; // default spacer height

      if (below?.id === item.id) {
        // Spacer below flying has extra height
        spacerHeight = item.height + spacerHeight;
      }

      // Set spacer
      ret.push({
        type: 'spacer',
        id: item.id + '-spacer',
        itemId: item.id,
        y,
        height: spacerHeight,
      });
      y += spacerHeight;

      // Set item
      ret.push({
        ...item,
        ...{
          type: 'item',
          y,
          height: itemHeight,
        },
      });
      y += itemHeight;
    });

    return ret;
  }, [below?.id, data]);

  //console.log('> render', {selected, below});

  selectedRef.current = selected;
  layoutRef.current = layout?.layout;

  const renderFlatListItem = itemData => {
    if (!panning && selected?.id === itemData.item.id) {
      return renderSelectedItem(itemData);
    } else {
      return (
        <CustomItem
          itemData={itemData}
          onSelected={onSelected}
          setSelected={setSelected}>
          {renderItem(itemData)}
        </CustomItem>
      );
    }
  };

  const renderFlyingItem = () => {
    if (selected && panning && layout.layout) {
      return (
        <Animated.View
          style={[
            styles.flying,
            {top: -layout.layout.y * 1.5},
            {transform: [{translateY: pan.y}]},
          ]}>
          {renderItem({item: selected})}
        </Animated.View>
      );
    } else {
      return null;
    }
  };

  const handleLayout = useCallback(e => {
    setLayout({layout: e.nativeEvent.layout});
  }, []);

  const onScroll = useCallback(e => {
    scrollOffsetY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const containerStyle = useMemo(() => {
    return {...styles.container, ...style};
  }, [style]);

  return (
    <View
      style={containerStyle}
      {...panResponder.panHandlers}
      onLayout={handleLayout}>
      <Animated.FlatList
        style={styles.list}
        ref={flatListRef}
        keyExtractor={item => item.id}
        data={preparedData}
        scrollEnabled={true}
        onScroll={onScroll}
        renderItem={renderFlatListItem}
      />
      {renderFlyingItem()}
    </View>
  );
};

const CustomItem = ({itemData, setSelected, onSelected, children}) => {
  const {item} = itemData;

  const handleSelected = useCallback(() => {
    setSelected(item);
    onSelected(item);
  }, [item, onSelected, setSelected]);

  const spacerStyle = useMemo(() => {
    const backgroundColor =
      item.height > 1
        ? {backgroundColor: 'darkgray'}
        : {backgroundColor: 'transparent'};
    return {...styles.spacer, ...backgroundColor, ...{height: item.height}};
  }, [item]);

  if (item?.type === 'item') {
    return (
      <TouchableWithoutFeedback onPress={handleSelected}>
        {children}
      </TouchableWithoutFeedback>
    );
  } else {
    return <View style={spacerStyle} id={item.id} />;
  }
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  spacer: {
    height: 1,
  },
  flying: {
    position: 'absolute',
    backgroundColor: 'lightgray',
  },
});

export default CustomDraggableFlatList;
